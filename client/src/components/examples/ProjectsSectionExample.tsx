import ProjectsSection from "../ProjectsSection";
import dashboardImg from "@assets/generated_images/dashboard_project_screenshot.png";
import mobileImg from "@assets/generated_images/mobile_app_project_screenshot.png";
import codeImg from "@assets/generated_images/code_editor_project_screenshot.png";
import ecommerceImg from "@assets/generated_images/e-commerce_project_screenshot.png";

export default function ProjectsSectionExample() {
  // todo: remove mock functionality
  const mockProjects = [
    { id: "1", title: "Dashboard Analytics", imageUrl: dashboardImg },
    { id: "2", title: "Mobile App", imageUrl: mobileImg },
    { id: "3", title: "Code Editor", imageUrl: codeImg },
    { id: "4", title: "E-commerce Platform", imageUrl: ecommerceImg },
  ];

  return <ProjectsSection projects={mockProjects} />;
}
