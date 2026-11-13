import ProfileOverview from "./ProfileOverview";

export const metadata = {
  title: "Profile overview",
  description:
    "Networth and shard value of a Hypixel SkyBlock profile, calculated from the Hypixel API.",
};

export default function ProfilePage() {
  return <ProfileOverview />;
}
