import { Nav } from "@/components/landing/Nav";
import { Hero } from "@/components/landing/Hero";
import { Problem } from "@/components/landing/Problem";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { Roles } from "@/components/landing/Roles";
import { MatchingDemo } from "@/components/landing/MatchingDemo";
import { Tracking } from "@/components/landing/Tracking";
import { Closing } from "@/components/landing/Closing";
import { Footer } from "@/components/landing/Footer";

export default function Home() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <Problem />
        <HowItWorks />
        <Roles />
        <MatchingDemo />
        <Tracking />
        <Closing />
      </main>
      <Footer />
    </>
  );
}
