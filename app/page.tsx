import Link from "next/link";

export default function Home() {
  return (
    <main style={{ padding: 24 }}>
      <h1>AFCON 2025 Predictor</h1>
      <p>
        <Link href="/login">Login</Link> | <Link href="/signup">Sign up</Link> |{" "}
        <Link href="/predictions">Predictions</Link> |{" "}
        <Link href="/leaderboard">Leaderboard</Link>
      </p>
    </main>
  );
}
