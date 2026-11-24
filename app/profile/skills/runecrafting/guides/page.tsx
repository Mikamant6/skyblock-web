// Die Guides gibt es nur fuer die 5 Haupt-Skills: alte Adresse leitet auf die Guide-Uebersicht um.
import { redirect } from "next/navigation";

export default function OldGuidesPage() {
  redirect("/profile/guides");
}
