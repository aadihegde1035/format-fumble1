
import Navigation from "@/components/Navigation";
import TextCorruptorTool from "@/components/TextCorruptorTool";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <div className="flex-grow">
        <TextCorruptorTool />
      </div>
    </div>
  );
};

export default Index;
