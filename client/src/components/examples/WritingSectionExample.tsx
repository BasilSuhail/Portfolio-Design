import WritingSection from "../WritingSection";

export default function WritingSectionExample() {
  // todo: remove mock functionality
  const mockPosts = [
    { id: "1", date: "21/02/25", title: "How to think like both a designer & engineer", readTime: 2 },
    { id: "2", date: "16/02/25", title: "UI Performance", readTime: 4 },
    { id: "3", date: "12/02/25", title: "How AI is changing my workflow", readTime: 2 },
    { id: "4", date: "11/01/25", title: "Design tokens 101", readTime: 2 },
    { id: "5", date: "01/01/25", title: "Hello world", readTime: 1 },
  ];

  return <WritingSection posts={mockPosts} />;
}
