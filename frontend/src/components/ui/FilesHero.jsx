const FilesHero = () => {
  return (
    <div className="flex flex-col items-center text-center pt-16 pb-10 animate-fadeIn">
      <h1 className="text-3xl md:text-4xl font-bold text-textPrimary">
        My Files
      </h1>
      <p className="mt-3 text-textSecondary text-sm md:text-base">
        Here are the files you've uploaded. You can manage and organize them.
      </p>
    </div>
  );
};

export default FilesHero;
