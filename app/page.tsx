import Login from "@/components/login"

export default function Home() {
  // The root page redirects to login
  // Authentication state is handled by the layout wrapper
  return <Login />
}
