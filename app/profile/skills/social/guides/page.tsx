// Die Guides sind jetzt ein eigener Bereich: alte Adresse leitet dorthin um.
import { redirect } from "next/navigation";

export default function OldGuidesPage() {
  redirect("/profile/guides/social");
}
