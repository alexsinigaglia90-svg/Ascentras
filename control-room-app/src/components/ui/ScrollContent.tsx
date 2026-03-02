import React, { useState } from 'react';
import {
  Shield, Users, Activity, BarChart3,
  Clock, Headphones, Zap, ArrowRight,
  CheckCircle2, Building2, Cpu, TrendingUp,
  User, MapPin, Globe, Star, X
} from 'lucide-react';
import { profiles, domainFilters, type DomainFilter, type StaffProfile } from '../../data/profiles';
import styles from './ScrollContent.module.css';

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <div className={styles.featureCard}>
      <div className={styles.featureIcon}>{icon}</div>
      <h3 className={styles.featureTitle}>{title}</h3>
      <p className={styles.featureDesc}>{description}</p>
    </div>
  );
}

interface StatProps {
  value: string;
  label: string;
}

function Stat({ value, label }: StatProps) {
  return (
    <div className={styles.stat}>
      <div className={styles.statValue}>{value}</div>
      <div className={styles.statLabel}>{label}</div>
    </div>
  );
}

interface ProcessStepProps {
  step: string;
  title: string;
  description: string;
}

function ProcessStep({ step, title, description }: ProcessStepProps) {
  return (
    <div className={styles.processStep}>
      <div className={styles.processNum}>{step}</div>
      <div>
        <h4 className={styles.processTitle}>{title}</h4>
        <p className={styles.processDesc}>{description}</p>
      </div>
    </div>
  );
}

/* ── Profiles Showcase (inline) ── */
function ProfilesShowcase({ onRequestProfiles }: { onRequestProfiles: () => void }) {
  const [filter, setFilter] = useState<DomainFilter>('All');
  const [selected, setSelected] = useState<StaffProfile | null>(null);

  const filtered = filter === 'All'
    ? profiles
    : profiles.filter(p => p.specialty.some(s => s.toLowerCase().includes(filter.toLowerCase())));

  return (
    <section className={styles.profilesSection} id="profiles-section">
      <div className={styles.sectionInner}>
        <span className={styles.sectionTag}>Available Profiles</span>
        <h2 className={styles.sectionTitle}>
          Meet our control room<br />
          <span className={styles.titleAccent}>specialists.</span>
        </h2>
        <p className={styles.sectionSubtitle}>
          Senior operators with deep expertise in mechanised warehouse environments.
          Filter by domain, select a profile, and request directly.
        </p>
      </div>

      {/* Filters */}
      <div className={styles.profileFilters}>
        {domainFilters.map(f => (
          <button
            key={f}
            className={`${styles.profileFilterBtn} ${filter === f ? styles.profileFilterActive : ''}`}
            onClick={() => setFilter(f)}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Cards grid */}
      <div className={styles.profileCards}>
        {filtered.map(p => (
          <button
            key={p.id}
            className={`${styles.profileCard} ${selected?.id === p.id ? styles.profileCardActive : ''}`}
            onClick={() => setSelected(selected?.id === p.id ? null : p)}
          >
            <div className={styles.profileAvatar}>
              <User size={28} />
            </div>
            <div className={styles.profileName}>{p.name}</div>
            <div className={styles.profileRole}>{p.role}</div>
            <div className={styles.profileTags}>
              {p.specialty.map(s => (
                <span key={s} className={styles.profileTag}>{s}</span>
              ))}
            </div>
            <div className={styles.profileMeta}>
              <span className={`${styles.profileDot} ${styles['dot_' + p.availability.replace(/\s+/g, '')]}`}>
                {p.availability === 'Available' ? '●' : p.availability === 'On Assignment' ? '○' : '◐'}
              </span>
              <span className={styles.profileAvail}>{p.availability}</span>
            </div>
            <div className={styles.profileExp}>
              <Star size={13} />
              <span>{p.seniority} · {p.yearsExperience}y exp</span>
            </div>
          </button>
        ))}
      </div>

      {/* Detail drawer */}
      {selected && (
        <div className={styles.profileDetail}>
          <div className={styles.profileDetailInner}>
            <button className={styles.profileDetailClose} onClick={() => setSelected(null)}>
              <X size={16} />
            </button>
            <div className={styles.profileDetailHeader}>
              <div className={styles.profileDetailAvatar}><User size={28} /></div>
              <div>
                <div className={styles.profileDetailName}>{selected.name}</div>
                <div className={styles.profileDetailRole}>{selected.role}</div>
              </div>
            </div>
            <div className={styles.profileDetailBody}>
              <div className={styles.profileDetailRow}>
                <Star size={14} />
                <span>{selected.seniority} · {selected.yearsExperience} years experience</span>
              </div>
              <div className={styles.profileDetailRow}>
                <Globe size={14} />
                <span>{selected.languages.join(', ')}</span>
              </div>
              <div className={styles.profileDetailRow}>
                <MapPin size={14} />
                <span>{selected.availability}</span>
              </div>
              <p className={styles.profileDetailSummary}>{selected.summary}</p>
              <div className={styles.profileDetailTags}>
                {selected.specialty.map(s => (
                  <span key={s} className={styles.profileTag}>{s}</span>
                ))}
              </div>
              <button className={styles.profileDetailCta} onClick={onRequestProfiles}>
                Request This Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export function ScrollContent({ onRequestProfiles }: { onRequestProfiles: () => void }) {
  return (
    <div className={styles.content}>

      {/* ── Section 0: Profiles Showcase ── */}
      <ProfilesShowcase onRequestProfiles={onRequestProfiles} />

      {/* ── Section 1: Value Proposition ── */}
      <section className={styles.section}>
        <div className={styles.sectionInner}>
          <span className={styles.sectionTag}>Why Ascentra</span>
          <h2 className={styles.sectionTitle}>
            Control room expertise,<br />
            <span className={styles.titleAccent}>exactly when you need it.</span>
          </h2>
          <p className={styles.sectionSubtitle}>
            Mechanised warehouses demand specialised operators. We provide senior-level
            control room professionals who integrate seamlessly into your operation —
            from AutoStore and conveyor systems to WMS coordination and incident management.
          </p>
        </div>

        <div className={styles.features}>
          <FeatureCard
            icon={<Users size={24} />}
            title="Specialised Profiles"
            description="Control room managers, flow controllers, WMS coordinators, incident leads and performance analysts — each with deep domain expertise."
          />
          <FeatureCard
            icon={<Clock size={24} />}
            title="Rapid Deployment"
            description="Profiles operational within 48 hours. Pre-screened, pre-certified, ready for 24/7 mechanised environments."
          />
          <FeatureCard
            icon={<Shield size={24} />}
            title="Zero Risk"
            description="Flexible contracts with guaranteed performance metrics. If a profile doesn't deliver, we replace within 24 hours."
          />
          <FeatureCard
            icon={<TrendingUp size={24} />}
            title="Measurable Impact"
            description="Our operators consistently improve throughput by 12-18% while reducing incident response times by 40%."
          />
        </div>
      </section>

      {/* ── Section 2: Numbers ── */}
      <section className={styles.statsSection}>
        <div className={styles.statsInner}>
          <Stat value="150+" label="Operators Deployed" />
          <Stat value="98.7%" label="Uptime Maintained" />
          <Stat value="<48h" label="Deployment Time" />
          <Stat value="40%" label="Faster Incident Response" />
        </div>
      </section>

      {/* ── Section 3: Capabilities ── */}
      <section className={styles.section}>
        <div className={styles.sectionInner}>
          <span className={styles.sectionTag}>Capabilities</span>
          <h2 className={styles.sectionTitle}>
            Full-spectrum control room coverage.
          </h2>
          <p className={styles.sectionSubtitle}>
            From real-time flow management to strategic performance analysis —
            our profiles cover every function of a modern mechanised warehouse control room.
          </p>
        </div>

        <div className={styles.capGrid}>
          {[
            { icon: <Cpu size={20} />, label: 'AutoStore Operations' },
            { icon: <Activity size={20} />, label: 'Conveyor Flow Control' },
            { icon: <BarChart3 size={20} />, label: 'WMS Coordination' },
            { icon: <Shield size={20} />, label: 'Incident Management' },
            { icon: <TrendingUp size={20} />, label: 'Performance Analytics' },
            { icon: <Headphones size={20} />, label: '24/7 Shift Coverage' },
            { icon: <Zap size={20} />, label: 'ASRS Management' },
            { icon: <Building2 size={20} />, label: 'Multi-Site Coordination' },
          ].map(item => (
            <div key={item.label} className={styles.capItem}>
              <span className={styles.capIcon}>{item.icon}</span>
              <span className={styles.capLabel}>{item.label}</span>
              <CheckCircle2 size={16} className={styles.capCheck} />
            </div>
          ))}
        </div>
      </section>

      {/* ── Section 4: Process ── */}
      <section className={styles.section}>
        <div className={styles.sectionInner}>
          <span className={styles.sectionTag}>How It Works</span>
          <h2 className={styles.sectionTitle}>
            From request to operational<br />
            <span className={styles.titleAccent}>in three steps.</span>
          </h2>
        </div>

        <div className={styles.processGrid}>
          <ProcessStep
            step="01"
            title="Define Requirements"
            description="Tell us your systems, shift patterns, and domain needs. We map the perfect profile match from our specialist pool."
          />
          <ProcessStep
            step="02"
            title="Profile Selection"
            description="Review pre-qualified candidates with verified experience in your specific warehouse automation stack."
          />
          <ProcessStep
            step="03"
            title="Operational Start"
            description="Your selected operator integrates within 48 hours — fully briefed, system-certified, and shift-ready."
          />
        </div>
      </section>

      {/* ── Section 5: CTA ── */}
      <section className={styles.ctaSection}>
        <div className={styles.ctaInner}>
          <h2 className={styles.ctaTitle}>
            Ready to strengthen your control room?
          </h2>
          <p className={styles.ctaSubtitle}>
            Get matched with senior control room professionals who specialise
            in your exact automation environment.
          </p>
          <button className={styles.ctaButton} onClick={onRequestProfiles}>
            <span>Request Profiles</span>
            <ArrowRight size={18} />
          </button>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <div className={styles.footerBrand}>
            <span className={styles.footerLogo}>Ascentra</span>
            <span className={styles.footerDivider}>·</span>
            <span className={styles.footerUnit}>Operis</span>
          </div>
          <p className={styles.footerCopy}>
            Warehouse control room staffing solutions for mechanised environments.
          </p>
          <p className={styles.footerLegal}>
            © {new Date().getFullYear()} Ascentra. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
