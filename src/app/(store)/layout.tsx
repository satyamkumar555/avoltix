import Header from "@/components/Header";
import Footer from "@/components/Footer";
import MobileNav from "@/components/MobileNav";
import DemoBanner from "@/components/DemoBanner";
import AnnouncementBar from "@/components/AnnouncementBar";

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (<><DemoBanner /><AnnouncementBar /><Header /><main>{children}</main><Footer /><MobileNav /></>);
}
