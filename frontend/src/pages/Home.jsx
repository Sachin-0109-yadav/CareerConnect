
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Search,
  BriefcaseBusiness,
  Building2,
  Users,
  ArrowRight,
  Code,
  Database,
  Palette,
  BarChart3,
  Megaphone,
  Headphones,
  Sparkles,
} from "lucide-react";

import "./Home.css";

const categories = [
  { name: "Technology", jobs: "2,400+", icon: Code },
  { name: "Data & Analytics", jobs: "850+", icon: Database },
  { name: "Design", jobs: "620+", icon: Palette },
  { name: "Business", jobs: "1,100+", icon: BarChart3 },
  { name: "Marketing", jobs: "730+", icon: Megaphone },
  { name: "Customer Support", jobs: "540+", icon: Headphones },
];

const stats = [
  { number: "10K+", label: "Active Jobs", icon: BriefcaseBusiness },
  { number: "5K+", label: "Companies", icon: Building2 },
  { number: "50K+", label: "Job Seekers", icon: Users },
];

function Home() {
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  const handleSearch = (event) => {
    event.preventDefault();

    const query = search.trim();

    if (query) {
      navigate(`/jobs?search=${encodeURIComponent(query)}`);
    } else {
      navigate("/jobs");
    }
  };

  return (
    <div className="home-page">
      <main>
        <section className="hero-section">
          <div className="hero-content">
            <div className="hero-badge">
              <Sparkles size={15} />
              <span>Your career journey starts here</span>
            </div>

            <h1>
              Find a job that
              <br />
              <span>moves you forward.</span>
            </h1>

            <p className="hero-description">
              Explore opportunities, connect with leading companies,
              and discover a career you'll love.
            </p>

            <form className="hero-search" onSubmit={handleSearch}>
              <Search size={21} />

              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search jobs, skills or companies..."
                aria-label="Search jobs, skills or companies"
              />

              <button type="submit" className="search-button">
                Search Jobs
              </button>
            </form>

            <p className="popular-searches">
              Popular: Software Developer · Python · Data Analyst ·
              React Developer
            </p>
          </div>

          <div className="hero-visual">
            <div className="visual-card visual-card-main">
              <div className="visual-icon">
                <BriefcaseBusiness size={27} />
              </div>

              <h3>Your next opportunity awaits</h3>

              <p>Discover roles that match your skills.</p>

              <div className="visual-progress">
                <span />
              </div>

              <small>Explore opportunities</small>
            </div>

            <div className="floating-card floating-top">
              <Users size={19} />

              <div>
                <strong>50K+</strong>
                <small>Job seekers</small>
              </div>
            </div>

            <div className="floating-card floating-bottom">
              <Sparkles size={19} />

              <div>
                <strong>New opportunities</strong>
                <small>Every day</small>
              </div>
            </div>
          </div>
        </section>

        <section className="stats-section">
          {stats.map((stat) => {
            const Icon = stat.icon;

            return (
              <div className="stat-card" key={stat.label}>
                <Icon size={27} />

                <div>
                  <h2>{stat.number}</h2>
                  <p>{stat.label}</p>
                </div>
              </div>
            );
          })}
        </section>

        <section className="categories-section">
          <div className="section-heading">
            <div>
              <span className="section-eyebrow">
                EXPLORE OPPORTUNITIES
              </span>

              <h2>Browse by category</h2>

              <p>Find the right opportunity in your field.</p>
            </div>

            <Link to="/jobs" className="view-all">
              View all jobs <ArrowRight size={17} />
            </Link>
          </div>

          <div className="category-grid">
            {categories.map((category) => {
              const Icon = category.icon;

              return (
                <Link
                  to={`/jobs?category=${encodeURIComponent(category.name)}`}
                  className="category-card"
                  key={category.name}
                >
                  <div className="category-icon">
                    <Icon size={24} />
                  </div>

                  <h3>{category.name}</h3>

                  <p>{category.jobs} opportunities</p>

                  <ArrowRight
                    className="category-arrow"
                    size={18}
                  />
                </Link>
              );
            })}
          </div>
        </section>

        <section className="cta-section">
          <div>
            <span className="section-eyebrow">
              TAKE THE NEXT STEP
            </span>

            <h2>Ready to find your next opportunity?</h2>

            <p>
              Create your account and start exploring opportunities
              that match your ambitions.
            </p>
          </div>

          <Link to="/jobs" className="cta-button">
            Explore Jobs <ArrowRight size={18} />
          </Link>
        </section>
      </main>

      <footer className="home-footer">
        <Link to="/" className="brand footer-brand">
          <span className="brand-icon">
            <BriefcaseBusiness size={20} />
          </span>

          CareerConnect
        </Link>

        <p>Connecting talent with opportunity.</p>

        <span>
          © {new Date().getFullYear()} CareerConnect.
        </span>
      </footer>
    </div>
  );
}

export default Home;
