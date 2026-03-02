import React, { useState } from 'react';
import { useStore } from '../../state/store';
import { profiles, domainFilters, type DomainFilter, type StaffProfile } from '../../data/profiles';
import { User, MapPin, Globe, Star, ChevronRight, X, Briefcase } from 'lucide-react';
import styles from './ProfilesDock.module.css';

export function ProfilesDock() {
  const [filter, setFilter] = useState<DomainFilter>('All');
  const [selectedProfile, setSelectedProfile] = useState<StaffProfile | null>(null);
  const { setCameraTarget, setFocusedProfile } = useStore();

  const filtered = filter === 'All'
    ? profiles
    : profiles.filter(p => p.specialty.some(s => s.toLowerCase().includes(filter.toLowerCase())));

  const handleSelect = (p: StaffProfile) => {
    setSelectedProfile(p);
    setCameraTarget(p.id);
    setFocusedProfile(p.id);
  };

  const handleClose = () => {
    setSelectedProfile(null);
    setCameraTarget('overview');
    setFocusedProfile(null);
  };

  return (
    <div className={styles.dock}>
      {/* Section label */}
      <div className={styles.sectionLabel}>
        <span className={styles.sectionTag}>Available Profiles</span>
      </div>

      {/* Filters */}
      <div className={styles.filters}>
        {domainFilters.map(f => (
          <button
            key={f}
            className={`${styles.filterBtn} ${filter === f ? styles.filterActive : ''}`}
            onClick={() => setFilter(f)}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Profile cards */}
      <div className={styles.cards}>
        {filtered.map(p => (
          <button
            key={p.id}
            className={`${styles.card} ${selectedProfile?.id === p.id ? styles.cardActive : ''}`}
            onClick={() => handleSelect(p)}
          >
            <div className={styles.cardAvatar}>
              <User size={22} />
            </div>
            <div className={styles.cardInfo}>
              <div className={styles.cardName}>{p.name}</div>
              <div className={styles.cardRole}>{p.role}</div>
              <div className={styles.cardTags}>
                {p.specialty.slice(0, 3).map(s => (
                  <span key={s} className={styles.tag}>{s}</span>
                ))}
              </div>
            </div>
            <div className={styles.cardMeta}>
              <span className={`${styles.availability} ${styles[p.availability.replace(/\s+/g, '')]}`}>
                {p.availability === 'Available' ? '●' : p.availability === 'On Assignment' ? '○' : '◐'}
              </span>
              <span className={styles.availabilityLabel}>
                {p.availability}
              </span>
            </div>
          </button>
        ))}
      </div>

      {/* Detail panel */}
      {selectedProfile && (
        <div className={styles.detail}>
          <button className={styles.detailClose} onClick={handleClose}>
            <X size={14} />
          </button>
          <div className={styles.detailHeader}>
            <div className={styles.detailAvatar}><User size={24} /></div>
            <div>
              <div className={styles.detailName}>{selectedProfile.name}</div>
              <div className={styles.detailRole}>{selectedProfile.role}</div>
            </div>
          </div>
          <div className={styles.detailBody}>
            <div className={styles.detailRow}>
              <Star size={12} />
              <span>{selectedProfile.seniority} · {selectedProfile.yearsExperience}y experience</span>
            </div>
            <div className={styles.detailRow}>
              <Globe size={12} />
              <span>{selectedProfile.languages.join(', ')}</span>
            </div>
            <div className={styles.detailRow}>
              <MapPin size={12} />
              <span>{selectedProfile.availability}</span>
            </div>
            <p className={styles.detailSummary}>{selectedProfile.summary}</p>
            <div className={styles.detailTags}>
              {selectedProfile.specialty.map(s => (
                <span key={s} className={styles.tag}>{s}</span>
              ))}
            </div>
            <button className={styles.ctaBtn}>Request This Profile</button>
          </div>
        </div>
      )}
    </div>
  );
}
