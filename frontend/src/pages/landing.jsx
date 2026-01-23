import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Container, Stack } from '../components/common/index';
import {
  VideocamIcon,
  MicIcon,
  LockIcon,
  ScreenShareIcon,
  ChatIcon,
  SecurityIcon,
  PhonelinkLockIcon
} from '../icons/index';
import '../styles/landing.css';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="landing-page">
      <nav className="landing-navbar">
        <div className="landing-nav-container">
          <div className="landing-logo" onClick={() => navigate('/')}>
            <span className="logo-icon">▶</span>
            NEXUS
          </div>
          <div className="landing-nav-links">
            <button
              className="nav-link"
              onClick={() => navigate('/auth')}
            >
              Sign In
            </button>
            <Button
              variant="primary"
              size="md"
              onClick={() => navigate('/auth')}
            >
              Get Started
            </Button>
          </div>
        </div>
      </nav>

      <section className="landing-hero">
        <div className="landing-blob landing-blob-1"></div>
        <div className="landing-blob landing-blob-2"></div>
        <div className="landing-blob landing-blob-3"></div>

        <Container maxWidth="xl">
          <div className="hero-content">
            <div className="hero-text">
              <h1 className="hero-title">
                Crystal-clear <span className="gradient-text">video calls</span>{' '}
                for everyone
              </h1>
              <p className="hero-subtitle">
                Connect with your team in real-time. Secure, encrypted, and built
                for remote work. No downloads required.
              </p>

              <Stack direction="horizontal" spacing="base">
                <Button
                  variant="primary"
                  size="lg"
                  onClick={() => navigate('/auth')}
                  style={{ marginRight: '8px' }}
                >
                  Start Free Meeting
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => navigate('/auth')}
                >
                  Join as Guest
                </Button>
              </Stack>

              <p className="hero-note">
                No credit card required. Free unlimited meetings up to 1 hour.
              </p>
            </div>

            <div className="hero-visual">
              <div className="video-illustration">
                <div className="video-frame">
                  <div className="video-grid">
                    <div className="video-tile"></div>
                    <div className="video-tile"></div>
                    <div className="video-tile"></div>
                    <div className="video-tile"></div>
                  </div>
                </div>
                <div className="floating-card card-1">
                  <div className="card-icon"><VideocamIcon /></div>
                  <p>HD Video</p>
                </div>
                <div className="floating-card card-2">
                  <div className="card-icon"><MicIcon /></div>
                  <p>Crystal Audio</p>
                </div>
                <div className="floating-card card-3">
                  <div className="card-icon"><LockIcon /></div>
                  <p>End-to-End</p>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      <section className="landing-features">
        <Container maxWidth="lg">
          <div className="features-header">
            <h2>Everything you need for great meetings</h2>
            <p>Built with modern video conferencing in mind</p>
          </div>

          <div className="features-grid">
            {[
              {
                icon: VideocamIcon,
                title: 'High Quality Video',
                description: 'HD and 4K video quality with adaptive bitrate'
              },
              {
                icon: MicIcon,
                title: 'Crystal Clear Audio',
                description: 'Noise cancellation and audio optimization'
              },
              {
                icon: ScreenShareIcon,
                title: 'Screen Sharing',
                description: 'Share your screen with one click'
              },
              {
                icon: ChatIcon,
                title: 'Real-time Chat',
                description: 'Chat during calls without interrupting'
              },
              {
                icon: SecurityIcon,
                title: 'Enterprise Security',
                description: 'End-to-end encryption for all meetings'
              },
              {
                icon: PhonelinkLockIcon,
                title: 'Works Everywhere',
                description: 'Desktop, mobile, and browser support'
              }
            ].map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <div key={index} className="feature-card">
                  <div className="feature-icon"><IconComponent /></div>
                  <h3>{feature.title}</h3>
                  <p>{feature.description}</p>
                </div>
              );
            })}
          </div>
        </Container>
      </section>

      <section className="landing-cta">
        <Container maxWidth="lg">
          <div className="cta-content">
            <h2>Ready to connect?</h2>
            <p>Start your first meeting in seconds</p>
            <Stack direction="horizontal" spacing="base">
              <Button
                variant="primary"
                size="lg"
                onClick={() => navigate('/auth')}
                style={{ marginRight: '8px' }}
              >
                Sign Up Free
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => navigate('/auth')}
              >
                View Demo
              </Button>
            </Stack>
          </div>
        </Container>
      </section>

      <footer className="landing-footer">
        <Container maxWidth="xl">
          <div className="footer-content">
            <div className="footer-logo">
              <span className="logo-icon">▶</span>
              NEXUS
            </div>
            <div className="footer-links">
              <a href="#about">About</a>
              <a href="#privacy">Privacy</a>
              <a href="#terms">Terms</a>
              <a href="#contact">Contact</a>
            </div>
            <p className="footer-copyright">
              © 2024 NEXUS. All rights reserved.
            </p>
          </div>
        </Container>
      </footer>
    </div>
  );
}
