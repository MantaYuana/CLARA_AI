/**
 * guardrailService.ts
 * Checks contract text against Indonesian statutory limits and dangerous patterns.
 * Emits severity-tagged results (CRITICAL / WARNING / INFO) with actionable advice.
 *
 * Numeric extraction is delegated to ocrService.extractNumericVariables()
 * so there is a single source of truth for regex parsing.
 */
import { getSession } from "../../config/neo4j";
import { extractNumericVariables, NumericVariables } from "../ocr/ocrService";

export type Severity = "CRITICAL" | "WARNING" | "INFO";

export interface GuardrailCheck {
  name: string;
  triggered: boolean;
  severity: Severity;
  message: string;
  advice: string;
  legal_basis?: string;
}

export interface GuardrailReport {
  checks: GuardrailCheck[];
  critical_violations: GuardrailCheck[]; // triggered && severity === CRITICAL
  warning_count: number;
  is_safe: boolean; // true only when no CRITICAL violations
  extracted_variables: NumericVariables; // parsed numeric terms (for API consumers)
}

// Keyword / Pattern checks

interface KeywordRule {
  name: string;
  pattern: RegExp;
  severity: Severity;
  message: string;
  advice: string;
  legal_basis: string;
}

const KEYWORD_RULES: KeywordRule[] = [
  {
    name: "forced_seizure",
    pattern:
      /penyitaan\s+paksa|sita\s+jaminan\s+paksa|rampas\s+aset|klausula\s+penyitaan/i,
    severity: "CRITICAL",
    message:
      "Kontrak mengandung klausula penyitaan paksa yang melanggar putusan Mahkamah Konstitusi.",
    advice:
      "Minta penghapusan klausula penyitaan paksa ini. Penyitaan hanya sah melalui putusan pengadilan (MK No. 18/PUU-XVII/2019).",
    legal_basis: "Putusan MK No. 18/PUU-XVII/2019",
  },
  {
    name: "unilateral_termination",
    pattern:
      /mengakhiri\s+(?:perjanjian|kontrak|kerja\s+sama)\s+secara\s+sepihak|pengakhiran\s+sepihak/i,
    severity: "WARNING",
    message:
      "Kontrak mengandung klausula pengakhiran sepihak yang sulit diberlakukan tanpa putusan pengadilan.",
    advice:
      "Berdasarkan Pasal 1266 KUHPerdata, pembatalan perjanjian bilateral memerlukan penetapan pengadilan kecuali disepakati lain secara eksplisit. Pertimbangkan klausula penyelesaian sengketa melalui mediasi terlebih dahulu.",
    legal_basis: "Pasal 1266 KUHPerdata",
  },
  {
    name: "excessive_liquidated_damages",
    pattern:
      /ganti\s+rugi\s+sebesar\s+[3-9]\d{2,}%|denda\s+[3-9]\d{2,}%|penalti\s+[3-9]\d{2,}%/i,
    severity: "CRITICAL",
    message:
      "Klausula ganti rugi melebihi batas kelaziman (>300%) yang dapat dikualifikasikan sebagai perjanjian tidak adil.",
    advice:
      "Negosiasikan denda maksimal 5% per bulan sesuai batas wajar OJK. Klausula denda yang berlebihan dapat dibatalkan pengadilan.",
    legal_basis: "Regulasi OJK & Pasal 1267 KUHPerdata",
  },
  {
    name: "waiver_of_rights",
    pattern:
      /melepaskan\s+hak|mengesampingkan\s+hak|tidak\s+menuntut(?:\s+ganti\s+rugi)?|melepas\s+(?:semua\s+)?hak(?:\s+hukum)?/i,
    severity: "WARNING",
    message:
      "Kontrak mengandung klausula pelepasan hak yang dapat membatasi perlindungan hukum pihak yang lebih lemah.",
    advice:
      "Klausula pelepasan hak yang diperoleh melalui tekanan, penipuan, atau kekhilafan dapat dibatalkan (Pasal 1321 KUHPerdata). Pastikan klausula ini tidak melepaskan hak-hak minimum yang dilindungi undang-undang.",
    legal_basis: "Pasal 1321 KUHPerdata",
  },
  {
    name: "no_dispute_resolution",
    pattern: /^(?!.*(?:pengadilan|arbitrase|mediasi|bpsk|sengketa)).*$/is,
    severity: "INFO",
    message: "Kontrak tidak memiliki klausula penyelesaian sengketa yang eksplisit.",
    advice:
      "Tambahkan klausula penyelesaian sengketa: tahapan musyawarah → mediasi → arbitrase/pengadilan, beserta yurisdiksi yang berlaku.",
    legal_basis: "Praktik terbaik hukum kontrak Indonesia",
  },
];

// Numeric checks from Neo4j statutory limits

async function runNumericChecks(extracted: NumericVariables): Promise<GuardrailCheck[]> {
  const checks: GuardrailCheck[] = [];
  const session = await getSession();

  try {
    // Fetch statutory limits from Neo4j
    const limitsResult = await session.run(`
      MATCH (c:LegalConcept)
      WHERE c.name IN ['Bunga', 'Denda', 'PKWT']
      RETURN c.name AS name,
             c.max_interest_percent_per_month AS max_interest,
             c.max_penalty_percent_per_month AS max_penalty,
             c.max_duration_years AS max_duration
    `);

    const limits: Record<string, number> = {};
    limitsResult.records.forEach((rec) => {
      const name = rec.get("name") as string;
      if (name === "Bunga") limits.max_interest = rec.get("max_interest") ?? 2.0;
      if (name === "Denda") limits.max_penalty = rec.get("max_penalty") ?? 5.0;
      if (name === "PKWT") limits.max_duration = rec.get("max_duration") ?? 2.0;
    });

    // Fallback statutory caps if Neo4j has no data yet
    if (!limits.max_interest) limits.max_interest = 2.0; // OJK: 2%/bulan
    if (!limits.max_penalty) limits.max_penalty = 5.0; // OJK: 5%/bulan
    if (!limits.max_duration) limits.max_duration = 2.0; // UU 13/2003 Pasal 59

    // Interest rate
    if (extracted.interest_percent_per_month !== undefined) {
      const exceeded = extracted.interest_percent_per_month > limits.max_interest;
      checks.push({
        name: "interest_rate",
        triggered: exceeded,
        severity: exceeded ? "WARNING" : "INFO",
        message: exceeded
          ? `Suku bunga ${extracted.interest_percent_per_month}%/bulan melebihi batas OJK (${limits.max_interest}%/bulan).`
          : `Suku bunga ${extracted.interest_percent_per_month}%/bulan dalam batas wajar.`,
        advice: exceeded
          ? `Negosiasikan suku bunga di bawah ${limits.max_interest}%/bulan sesuai regulasi OJK.`
          : "",
        legal_basis: "Regulasi OJK Pinjaman",
      });
    }

    // Penalty rate
    if (extracted.penalty_percent_per_month !== undefined) {
      const exceeded = extracted.penalty_percent_per_month > limits.max_penalty;
      checks.push({
        name: "penalty_rate",
        triggered: exceeded,
        severity: exceeded ? "WARNING" : "INFO",
        message: exceeded
          ? `Denda ${extracted.penalty_percent_per_month}%/bulan melebihi batas wajar (${limits.max_penalty}%/bulan).`
          : `Denda ${extracted.penalty_percent_per_month}%/bulan dalam batas wajar.`,
        advice: exceeded
          ? `Negosiasikan denda maksimal ${limits.max_penalty}%/bulan. Denda berlebihan dapat dibatalkan pengadilan (Pasal 1267 KUHPerdata).`
          : "",
        legal_basis: "Pasal 1267 KUHPerdata & OJK",
      });
    }

    // Late interest per day
    if (extracted.late_interest_percent_per_day !== undefined) {
      // OJK limit: 0.1%/hari (equivalent to ~3%/bulan)
      const MAX_LATE_DAY = 0.1;
      const exceeded = extracted.late_interest_percent_per_day > MAX_LATE_DAY;
      checks.push({
        name: "late_interest_daily",
        triggered: exceeded,
        severity: exceeded ? "WARNING" : "INFO",
        message: exceeded
          ? `Bunga keterlambatan ${extracted.late_interest_percent_per_day}%/hari melebihi batas wajar OJK (${MAX_LATE_DAY}%/hari).`
          : `Bunga keterlambatan ${extracted.late_interest_percent_per_day}%/hari dalam batas wajar.`,
        advice: exceeded
          ? `Negosiasikan bunga keterlambatan di bawah ${MAX_LATE_DAY}%/hari sesuai panduan OJK.`
          : "",
        legal_basis: "Panduan OJK & Pasal 1267 KUHPerdata",
      });
    }

    // Retention percentage
    if (extracted.retention_percent !== undefined) {
      // Standard construction/service: retention ≤ 5%
      const MAX_RETENTION = 5;
      const exceeded = extracted.retention_percent > MAX_RETENTION;
      checks.push({
        name: "retention_rate",
        triggered: exceeded,
        severity: exceeded ? "WARNING" : "INFO",
        message: exceeded
          ? `Retensi ${extracted.retention_percent}% melebihi standar industri (${MAX_RETENTION}%).`
          : `Retensi ${extracted.retention_percent}% dalam batas standar industri.`,
        advice: exceeded
          ? `Negosiasikan retensi maksimal ${MAX_RETENTION}% dari nilai kontrak sesuai standar industri jasa konstruksi.`
          : "",
        legal_basis: "Praktik industri & Peraturan Menteri PUPR",
      });
    }

    // Down payment percentage
    if (extracted.dp_percent !== undefined) {
      // Minimum DP for vendor protection: ≥ 20%; maximum upfront to buyer: ≤ 50%
      const tooLow = extracted.dp_percent < 20;
      const tooHigh = extracted.dp_percent > 50;
      if (tooLow || tooHigh) {
        checks.push({
          name: "dp_percent",
          triggered: true,
          severity: "WARNING",
          message: tooLow
            ? `Uang muka ${extracted.dp_percent}% di bawah batas minimum yang disarankan (20%), meningkatkan risiko pembatalan sepihak.`
            : `Uang muka ${extracted.dp_percent}% sangat tinggi (>50%), meningkatkan risiko bagi pembeli.`,
          advice: tooLow
            ? "Negosiasikan uang muka minimal 20-30% untuk melindungi kepentingan penyedia jasa."
            : "Uang muka di atas 50% berisiko jika vendor gagal menyelesaikan pekerjaan. Pertimbangkan escrow.",
          legal_basis: "Praktik terbaik hukum kontrak Indonesia",
        });
      }
    }

    // Penalty lump-sum
    if (extracted.penalty_lump_sum_idr !== undefined) {
      // Flag nominal penalties > Rp 500 juta for review
      const THRESHOLD_IDR = 500_000_000;
      const exceeded = extracted.penalty_lump_sum_idr > THRESHOLD_IDR;
      checks.push({
        name: "penalty_lump_sum",
        triggered: exceeded,
        severity: exceeded ? "WARNING" : "INFO",
        message: exceeded
          ? `Denda nominal Rp ${extracted.penalty_lump_sum_idr.toLocaleString("id-ID")} perlu dikaji proporsionalitasnya terhadap nilai kontrak.`
          : `Denda nominal Rp ${extracted.penalty_lump_sum_idr.toLocaleString("id-ID")} terdeteksi.`,
        advice: exceeded
          ? "Pastikan denda proporsional dengan nilai kontrak dan kerugian aktual. Denda yang tidak proporsional dapat dikurangi pengadilan (Pasal 1267 KUHPerdata)."
          : "",
        legal_basis: "Pasal 1267 KUHPerdata",
      });
    }

    // PKWT duration
    if (extracted.pkwt_duration_years !== undefined) {
      const exceeded = extracted.pkwt_duration_years > limits.max_duration;
      checks.push({
        name: "pkwt_duration",
        triggered: exceeded,
        severity: exceeded ? "CRITICAL" : "INFO",
        message: exceeded
          ? `Durasi PKWT ${extracted.pkwt_duration_years} tahun melebihi batas maksimal ${limits.max_duration} tahun.`
          : `Durasi PKWT ${extracted.pkwt_duration_years} tahun sesuai UU Ketenagakerjaan.`,
        advice: exceeded
          ? `PKWT maksimal ${limits.max_duration} tahun (Pasal 59 UU 13/2003). PKWT melebihi batas otomatis menjadi PKWTT.`
          : "",
        legal_basis: "Pasal 59 UU No. 13 Tahun 2003",
      });
    }
  } finally {
    await session.close();
  }

  return checks;
}

// Main export

export async function runGuardrailChecks(contractText: string): Promise<GuardrailReport> {
  const allChecks: GuardrailCheck[] = [];

  // 1. Keyword / pattern checks
  for (const rule of KEYWORD_RULES) {
    // Skip the "no_dispute_resolution" info check for short texts
    if (rule.name === "no_dispute_resolution" && contractText.length < 200) continue;
    const triggered = rule.pattern.test(contractText);
    allChecks.push({
      name: rule.name,
      triggered,
      severity: rule.severity,
      message: triggered
        ? rule.message
        : `Tidak ditemukan: ${rule.name.replace(/_/g, " ")}`,
      advice: triggered ? rule.advice : "",
      legal_basis: rule.legal_basis,
    });
  }

  // 2. Numeric checks (requires Neo4j — graceful fallback on connection failure)
  const extracted = extractNumericVariables(contractText);
  try {
    const numericChecks = await runNumericChecks(extracted);
    allChecks.push(...numericChecks);
  } catch {
    // Neo4j not available (e.g. during unit tests) — skip numeric checks silently
  }

  const critical_violations = allChecks.filter(
    (c) => c.triggered && c.severity === "CRITICAL",
  );
  const warning_count = allChecks.filter(
    (c) => c.triggered && c.severity === "WARNING",
  ).length;

  return {
    checks: allChecks,
    critical_violations,
    warning_count,
    is_safe: critical_violations.length === 0,
    extracted_variables: extracted,
  };
}

/**
 * Phase 2 guardrail entry point — used by POST /api/v1/contract/validate.
 *
 * Runs keyword checks on the raw contract text (same as runGuardrailChecks)
 * but uses the **caller-supplied** numeric variables instead of auto-extracting
 * them from the text.  This lets users correct OCR mis-reads (e.g. 50% → 5%)
 * before the deterministic limit checks are executed.
 *
 * @param contractText  Raw OCR text from Phase 1 (for keyword pattern checks)
 * @param variables     User-corrected NumericVariables from the frontend
 */
export async function runGuardrailChecksWithVariables(
  contractText: string,
  variables: Partial<NumericVariables>,
): Promise<GuardrailReport> {
  const allChecks: GuardrailCheck[] = [];

  // 1. Keyword / pattern checks (identical to runGuardrailChecks)
  for (const rule of KEYWORD_RULES) {
    if (rule.name === "no_dispute_resolution" && contractText.length < 200) continue;
    const triggered = rule.pattern.test(contractText);
    allChecks.push({
      name: rule.name,
      triggered,
      severity: rule.severity,
      message: triggered
        ? rule.message
        : `Tidak ditemukan: ${rule.name.replace(/_/g, " ")}`,
      advice: triggered ? rule.advice : "",
      legal_basis: rule.legal_basis,
    });
  }

  // 2. Numeric checks — use caller-supplied (corrected) variables
  try {
    const numericChecks = await runNumericChecks(variables as NumericVariables);
    allChecks.push(...numericChecks);
  } catch {
    // Neo4j not available — skip numeric checks silently
  }

  const critical_violations = allChecks.filter(
    (c) => c.triggered && c.severity === "CRITICAL",
  );
  const warning_count = allChecks.filter(
    (c) => c.triggered && c.severity === "WARNING",
  ).length;

  return {
    checks: allChecks,
    critical_violations,
    warning_count,
    is_safe: critical_violations.length === 0,
    extracted_variables: variables as NumericVariables,
  };
}
