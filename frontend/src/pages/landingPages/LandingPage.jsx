import React from 'react';
import { Link } from 'react-router-dom';
import Header from '../../components/Header.jsx';
import Footer from '../../components/Footer.jsx';
import PageTransition from '../../shared/ui/PageTransition';

const HIGHLIGHTS = [
  { title: '1,200+', description: 'Active mentees collaborating with mentors each semester.' },
  { title: '350+', description: 'Industry professionals and senior students serving as mentors.' },
  { title: '4.8/5', description: 'Average satisfaction rating from mentorship sessions.' }
];

const STEPS = [
  { title: 'Sign up', body: 'Create your account and choose whether you want to mentor or be mentored.' },
  { title: 'Match intelligently', body: 'Our matching engine pairs mentees with mentors based on goals, skills, and availability.' },
  { title: 'Grow together', body: 'Track milestones, schedule sessions, and share feedback inside the platform.' }
];

const FEATURES = [
  {
    title: 'Structured Learning Tracks',
    body: 'Personalized pathways keep mentees progressing with curated modules and mentor guidance.'
  },
  {
    title: 'Session Planning & Analytics',
    body: 'Built-in scheduling, attendance tracking, and insights help administrators keep the program on course.'
  },
  {
    title: 'Community Recognition',
    body: 'Celebrate achievements with digital certificates, highlight reels, and mentor spotlights.'
  }
];

const TESTIMONIALS = [
  {
    quote: 'This platform transformed how we mentor. Scheduling, communication, and progress tracking now happen in one place.',
    name: 'Rina D.',
    role: 'Faculty Mentor'
  },
  {
    quote: 'Having a mentor who understood my career goals kept me motivated. The learning plans kept us aligned every week.',
    name: 'Jared S.',
    role: '3rd Year Mentee'
  }
];

export default function LandingPage() {
  return (
    <div className="tw-min-h-screen tw-bg-white tw-flex tw-flex-col">
      <Header />

  <PageTransition>
  <main className="tw-flex-1 tw-space-y-24 tw-pt-0">
        {/* Hero Section */}
  <section className="tw-relative tw-overflow-hidden tw-bg-gradient-to-br tw-from-purple-50 tw-via-white tw-to-orange-50">
          <span
            aria-hidden="true"
            className="tw-pointer-events-none tw-absolute tw--top-32 tw-right-[-6rem] tw-h-80 tw-w-80 tw-rounded-full tw-bg-gradient-to-br tw-from-primary/20 tw-via-accent/20 tw-to-orange-300/30 tw-blur-3xl tw-animate-spin-slow"
          />
          <span
            aria-hidden="true"
            className="tw-pointer-events-none tw-absolute tw--bottom-32 tw-left-[-4rem] tw-h-96 tw-w-96 tw-rounded-full tw-bg-gradient-to-br tw-from-purple-300/40 tw-via-white/40 tw-to-orange-200/30 tw-blur-3xl tw-animate-float"
          />
          <span
            aria-hidden="true"
            className="tw-pointer-events-none tw-absolute tw-top-1/2 tw-left-1/2 tw-h-[520px] tw-w-[520px] tw--translate-x-1/2 tw--translate-y-1/2 tw-rounded-full tw-bg-gradient-to-br tw-from-purple-200/30 tw-via-accent/20 tw-to-orange-200/10 tw-blur-3xl tw-animate-pulse-glow"
          />
          <div className="tw-relative tw-max-w-7xl tw-mx-auto tw-px-6 lg:tw-px-12 tw-py-24 tw-grid tw-grid-cols-1 lg:tw-grid-cols-2 tw-gap-12 tw-items-center">
            <div className="tw-space-y-8">
              <span className="tw-inline-flex tw-items-center tw-gap-2 tw-rounded-full tw-bg-white tw-px-4 tw-py-2 tw-text-sm tw-font-semibold tw-text-primary tw-shadow-sm">
                Mentor smarter, grow faster
              </span>
              <h1 className="tw-text-4xl sm:tw-text-5xl tw-font-extrabold tw-leading-tight tw-text-gray-900">
                A Modern Mentoring Hub Built for Collaborative Growth
              </h1>
              <p className="tw-text-lg tw-text-gray-600 tw-leading-relaxed">
                Bring mentors, mentees, and administrators together with a unified workspace for planning sessions,
                measuring progress, and celebrating achievements.
              </p>
              <div className="tw-flex tw-flex-col sm:tw-flex-row tw-gap-4">
                <Link
                  to="/register"
                  className="tw-inline-flex tw-items-center tw-justify-center tw-rounded-xl tw-bg-primary tw-text-white tw-px-8 tw-py-3 tw-text-base tw-font-semibold hover:tw-brightness-110 tw-transition"
                >
                  Create an account
                </Link>
                <Link
                  to="/features"
                  className="tw-inline-flex tw-items-center tw-justify-center tw-rounded-xl tw-border tw-border-purple-200 tw-bg-white tw-text-primary tw-px-8 tw-py-3 tw-text-base tw-font-semibold hover:tw-border-purple-400 tw-transition"
                >
                  Explore features
                </Link>
              </div>
            </div>
            <div className="tw-relative tw-flex tw-justify-center">
              <div className="tw-relative tw-w-full tw-max-w-lg">
                <div className="tw-absolute tw-inset-0 tw-rounded-3xl tw-bg-gradient-to-br tw-from-white tw-via-purple-100/60 tw-to-orange-100/70 tw-blur-3xl tw-opacity-80" aria-hidden="true" />
                <div className="tw-relative tw-rounded-3xl tw-bg-white/80 tw-backdrop-blur-lg tw-shadow-2xl tw-border tw-border-white/70 tw-p-6 tw-space-y-6">
                  <div className="tw-flex tw-items-center tw-justify-between">
                    <div>
                      <p className="tw-text-sm tw-font-semibold tw-text-primary">Live program snapshot</p>
                      <h2 className="tw-text-xl tw-font-bold tw-text-gray-900">Mentorship Pipeline</h2>
                    </div>
                    <span className="tw-inline-flex tw-items-center tw-rounded-full tw-bg-purple-100 tw-px-3 tw-py-1 tw-text-xs tw-font-semibold tw-text-primary">
                      Updated daily
                    </span>
                  </div>
                  <ul className="tw-space-y-4">
                    <li className="tw-flex tw-items-center tw-justify-between tw-gap-4">
                      <span className="tw-text-sm tw-font-medium tw-text-gray-700">Pending mentee applications</span>
                      <span className="tw-text-base tw-font-semibold tw-text-gray-900">48</span>
                    </li>
                    <li className="tw-flex tw-items-center tw-justify-between tw-gap-4">
                      <span className="tw-text-sm tw-font-medium tw-text-gray-700">Active mentor sessions this week</span>
                      <span className="tw-text-base tw-font-semibold tw-text-gray-900">132</span>
                    </li>
                    <li className="tw-flex tw-items-center tw-justify-between tw-gap-4">
                      <span className="tw-text-sm tw-font-medium tw-text-gray-700">Average satisfaction score</span>
                      <span className="tw-text-base tw-font-semibold tw-text-gray-900">4.8</span>
                    </li>
                  </ul>
                  <div className="tw-rounded-2xl tw-bg-gradient-to-br tw-from-purple-50 tw-to-white tw-p-4">
                    <p className="tw-text-sm tw-text-primary">
                      “The admin dashboard gives us complete visibility into mentor availability and mentee progress.”
                    </p>
                    <p className="tw-mt-2 tw-text-xs tw-font-semibold tw-text-primary/70">Program Coordinator, College of Computing</p>
                  </div>
                </div>
                <div className="tw-absolute tw--right-8 tw--bottom-10 tw-hidden lg:tw-block">
                  <div className="tw-rounded-2xl tw-bg-white/80 tw-backdrop-blur tw-shadow-lg tw-border tw-border-purple-100 tw-p-4 tw-flex tw-flex-col tw-gap-2 tw-animate-float">
                    <p className="tw-text-xs tw-font-semibold tw-text-primary/80">Upcoming mentorship sync</p>
                    <div className="tw-flex tw-items-center tw-justify-between">
                      <span className="tw-text-sm tw-font-semibold tw-text-gray-900">UI/UX Project Deep Dive</span>
                      <span className="tw-rounded-full tw-bg-purple-100 tw-px-2 tw-py-1 tw-text-[11px] tw-font-semibold tw-text-primary">Today</span>
                    </div>
                    <p className="tw-text-[11px] tw-text-gray-500">Mentor: Jaime L. · 3rd year mentee cohort</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Highlights Section */}
        <section className="tw-relative">
          <div className="tw-absolute tw-inset-0 tw-pointer-events-none tw-bg-gradient-to-r tw-from-white tw-via-purple-50/40 tw-to-white" aria-hidden="true" />
          <div className="tw-relative tw-max-w-6xl tw-mx-auto tw-px-6 lg:tw-px-8">
            <div className="tw-grid tw-grid-cols-1 sm:tw-grid-cols-3 tw-gap-6">
              {HIGHLIGHTS.map((item) => (
                <div
                  key={item.title}
                  className="tw-group tw-rounded-2xl tw-border tw-border-purple-100 tw-bg-white/80 tw-backdrop-blur tw-p-8 tw-shadow-sm tw-transition tw-transform hover:tw--translate-y-2 hover:tw-shadow-xl"
                >
                  <p className="tw-text-4xl tw-font-extrabold tw-text-primary">{item.title}</p>
                  <p className="tw-mt-3 tw-text-sm tw-text-gray-600">{item.description}</p>
                  <span className="tw-mt-4 tw-inline-flex tw-h-1 tw-w-12 tw-rounded-full tw-bg-gradient-to-r tw-from-primary tw-via-accent tw-to-orange-300 tw-transition tw-scale-x-[0.65] group-hover:tw-scale-x-100" />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="tw-bg-white">
          <div className="tw-max-w-6xl tw-mx-auto tw-px-6 lg:tw-px-8 tw-space-y-10">
            <div className="tw-text-center tw-space-y-4">
              <span className="tw-inline-flex tw-items-center tw-rounded-full tw-bg-purple-100 tw-px-3 tw-py-1 tw-text-xs tw-font-semibold tw-text-purple-700">How it works</span>
              <h2 className="tw-text-3xl tw-font-bold tw-text-gray-900">Guided Mentoring from Onboarding to Outcomes</h2>
              <p className="tw-text-gray-600 tw-max-w-2xl tw-mx-auto">
                We streamline every stage of the mentoring lifecycle so mentors can focus on coaching and mentees can focus on learning.
              </p>
            </div>
            <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-3 tw-gap-8">
              {STEPS.map((step, index) => (
                <div key={step.title} className="tw-relative tw-rounded-2xl tw-border tw-border-purple-100 tw-bg-white tw-p-6 tw-shadow-sm tw-space-y-3 tw-overflow-hidden">
                  <span className="tw-absolute tw-inset-x-0 tw-top-0 tw-h-1 tw-bg-gradient-to-r tw-from-primary tw-via-accent tw-to-orange-300" aria-hidden="true" />
                  <span className="tw-inline-flex tw-w-10 tw-h-10 tw-items-center tw-justify-center tw-rounded-full tw-bg-primary/10 tw-text-primary tw-font-semibold">
                    0{index + 1}
                  </span>
                  <h3 className="tw-text-xl tw-font-semibold tw-text-gray-900">{step.title}</h3>
                  <p className="tw-text-sm tw-text-gray-600">{step.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Feature Grid */}
        <section className="tw-max-w-6xl tw-mx-auto tw-px-6 lg:tw-px-8">
          <div className="tw-text-center tw-mb-12">
            <span className="tw-inline-flex tw-items-center tw-rounded-full tw-bg-purple-100 tw-px-3 tw-py-1 tw-text-xs tw-font-semibold tw-text-primary">Platform capabilities</span>
            <h2 className="tw-mt-4 tw-text-3xl tw-font-bold tw-text-gray-900">Tools that keep Mentors, Mentees, and Admins aligned.</h2>
          </div>
          <div className="tw-grid tw-grid-cols-1 lg:tw-grid-cols-3 tw-gap-8">
            {FEATURES.map((feature) => (
              <article
                key={feature.title}
                className="tw-group tw-relative tw-rounded-3xl tw-bg-white tw-border tw-border-purple-100 tw-p-8 tw-shadow-sm tw-space-y-4 tw-overflow-hidden"
              >
                <span className="tw-absolute tw-inset-0 tw-bg-gradient-to-br tw-from-purple-50 tw-via-white tw-to-orange-50 tw-opacity-0 group-hover:tw-opacity-100 tw-transition" aria-hidden="true" />
                <div className="tw-relative tw-space-y-4">
                  <span className="tw-inline-flex tw-h-12 tw-w-12 tw-items-center tw-justify-center tw-rounded-2xl tw-bg-primary/10 tw-text-primary tw-font-semibold">
                    {feature.title.slice(0, 1)}
                  </span>
                  <h3 className="tw-text-2xl tw-font-semibold tw-text-gray-900">{feature.title}</h3>
                  <p className="tw-text-sm tw-text-gray-600">{feature.body}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* Testimonials */}
        <section className="tw-relative tw-overflow-hidden tw-rounded-[3rem] tw-mx-6 lg:tw-mx-12">
          <div className="tw-absolute tw-inset-0 tw-bg-gradient-to-r tw-from-primary tw-via-accent tw-to-orange-400" aria-hidden="true" />
          <div className="tw-relative tw-max-w-6xl tw-mx-auto tw-px-6 lg:tw-px-10 tw-py-20 tw-grid tw-grid-cols-1 md:tw-grid-cols-2 tw-gap-10 tw-text-white">
            {TESTIMONIALS.map((item) => (
              <blockquote key={item.name} className="tw-rounded-3xl tw-bg-white/15 tw-p-8 tw-backdrop-blur-sm tw-border tw-border-white/20 tw-space-y-4">
                <p className="tw-text-lg tw-leading-relaxed">“{item.quote}”</p>
                <footer className="tw-text-sm tw-font-semibold">{item.name} — {item.role}</footer>
              </blockquote>
            ))}
          </div>
        </section>

        {/* Call to Action */}
        <section className="tw-max-w-5xl tw-mx-auto tw-px-6 lg:tw-px-8">
          <div className="tw-rounded-3xl tw-bg-white tw-border tw-border-purple-100 tw-shadow-[0_20px_80px_-35px_rgba(91,22,163,0.7)] tw-p-10 tw-flex tw-flex-col lg:tw-flex-row tw-gap-6 tw-items-center tw-justify-between">
            <div className="tw-space-y-3">
              <span className="tw-inline-flex tw-items-center tw-rounded-full tw-bg-purple-100 tw-px-3 tw-py-1 tw-text-xs tw-font-semibold tw-text-primary">Next step</span>
              <h2 className="tw-text-3xl tw-font-bold tw-text-gray-900">Ready to raise your mentoring program to the next level?</h2>
              <p className="tw-text-sm tw-text-gray-600 tw-leading-relaxed">
                Launch a structured mentorship experience that keeps everyone aligned—from mentees seeking guidance to admins monitoring impact.
              </p>
            </div>
            <Link
              to="/register"
              className="tw-inline-flex tw-items-center tw-justify-center tw-rounded-xl tw-bg-primary tw-text-white tw-px-6 tw-py-3 tw-text-sm tw-font-semibold hover:tw-brightness-110 tw-transition"
            >
              Get started today
            </Link>
          </div>
        </section>
  </main>
  <Footer />
  </PageTransition>
    </div>
  );
}
