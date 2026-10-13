
export default function Dashboard({ user }) {
  const titles = {
    customer: "Customer Dashboard",
    host: "Host Dashboard",
    admin: "Admin Dashboard",
  };

  const descriptions = {
    customer: "Search rentals and manage your bookings.",
    host: "Manage your properties and view reservations.",
    admin: "Review listings and monitor platform activity.",
  };

  return (
    <main className="dashboard-page">
      <div className="dashboard-card">
        <span className="eyebrow">
          {user.role.toUpperCase()} ACCOUNT
        </span>
        <h1>Welcome, {user.name}!</h1>
        <h2>{titles[user.role]}</h2>
        <p>{descriptions[user.role]}</p>
        <p className="dashboard-note">
          More dashboard features coming soon.
        </p>
      </div>
    </main>
  );
}
