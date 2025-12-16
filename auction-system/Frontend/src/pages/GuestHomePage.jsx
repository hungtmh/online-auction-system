import GuestHomePageContent from "../components/GuestHomePage/GuestHomePageContent";
import PublicLayout from "../components/Layout/PublicLayout";

function GuestHomePage({ user }) {
  return (
    <PublicLayout user={user}>
      <GuestHomePageContent user={user} />
    </PublicLayout>
  );
}

export default GuestHomePage;
