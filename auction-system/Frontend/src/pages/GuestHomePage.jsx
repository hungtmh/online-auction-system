import GuestHomePageContent from "../components/GuestHomePage/GuestHomePageContent";

function GuestHomePage({ user }) {
  return (
    <div>
      <GuestHomePageContent user={user} />
    </div>
  );
}

export default GuestHomePage;
