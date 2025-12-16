import AuctionListPageContent from '../components/AuctionList/AuctionListPageContent'
import PublicLayout from '../components/Layout/PublicLayout'

function AuctionListPage({ user }) {
  return (
    <PublicLayout user={user}>
      <AuctionListPageContent user={user} />
    </PublicLayout>
  )
}

export default AuctionListPage
