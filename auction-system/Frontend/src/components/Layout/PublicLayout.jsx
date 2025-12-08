import UnifiedNavbar from "../common/UnifiedNavbar";
import AppFooter from "../common/AppFooter";

export default function PublicLayout({ children, user }) {
  return (
    <>
      <UnifiedNavbar user={user} />

      <main className="flex-1">{children}</main>

      <AppFooter />
    </>
  );
}
