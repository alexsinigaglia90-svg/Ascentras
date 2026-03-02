import React, { useState } from 'react';
import { X, Send } from 'lucide-react';
import styles from './RequestModal.module.css';

interface RequestModalProps {
  open: boolean;
  onClose: () => void;
}

export function RequestModal({ open, onClose }: RequestModalProps) {
  const [submitted, setSubmitted] = useState(false);

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      onClose();
    }, 2000);
  };

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <button className={styles.close} onClick={onClose}>
          <X size={16} />
        </button>

        {submitted ? (
          <div className={styles.success}>
            <div className={styles.successIcon}>✓</div>
            <h3>Request Received</h3>
            <p>We will be in contact within 24 hours.</p>
          </div>
        ) : (
          <>
            <h2 className={styles.title}>Request Profiles</h2>
            <p className={styles.subtitle}>
              Tell us about your control room requirements and we'll match the right profiles.
            </p>
            <form className={styles.form} onSubmit={handleSubmit}>
              <div className={styles.field}>
                <label>Company</label>
                <input type="text" placeholder="Your organisation" required />
              </div>
              <div className={styles.field}>
                <label>Contact Name</label>
                <input type="text" placeholder="Full name" required />
              </div>
              <div className={styles.field}>
                <label>Email</label>
                <input type="email" placeholder="you@company.com" required />
              </div>
              <div className={styles.field}>
                <label>Roles Needed</label>
                <select>
                  <option>Control Room Manager</option>
                  <option>Flow Controller</option>
                  <option>WMS / Automation Coordinator</option>
                  <option>Incident Lead</option>
                  <option>Performance Analyst</option>
                  <option>Multiple / Other</option>
                </select>
              </div>
              <div className={styles.field}>
                <label>Message</label>
                <textarea placeholder="Brief description of your requirements" rows={3} />
              </div>
              <button type="submit" className={styles.submit}>
                <Send size={14} />
                Submit Request
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
