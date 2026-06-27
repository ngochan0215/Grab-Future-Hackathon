import { useState } from 'react';
import {
  Home, Briefcase, GraduationCap, Building2,
  Clock,
  HardHat, ArrowUpDown, AlertTriangle,
  Search, Map, Bookmark, User,
} from 'lucide-react';
import styles from '../styles/HomePage.module.css';
import SearchBar from '../components/common/SearchBar/SearchBar';
import AlertCard from '../components/common/AlertCard/AlertCard';
import RouteCard from '../components/common/RouteCard/RouteCard';
import BottomNav from '../components/layout/BottomNav/BottomNav';

const QUICK_PLACES = [
  { id: 'home',     label: 'Home',     icon: Home          },
  { id: 'work',     label: 'Work',     icon: Briefcase     },
  { id: 'school',   label: 'School',   icon: GraduationCap },
  { id: 'hospital', label: 'Hospital', icon: Building2     },
];

const RECENT = [
  { id: 1, name: 'City Hospital',       address: '14 Hùng Vương, Q.5',     time: '2h ago'    },
  { id: 2, name: 'Bến Thành Market',    address: 'Lê Lợi, Q.1',            time: 'Yesterday' },
  { id: 3, name: 'Independence Palace', address: 'Nam Kỳ Khởi Nghĩa, Q.1', time: 'Mon'       },
];

const ALERTS = [
  { id: 1, severity: 'warning', icon: HardHat,       title: 'Roadwork on Lê Lợi St',  desc: 'Sidewalk closed 50 m — use Pasteur St instead' },
  { id: 2, severity: 'danger',  icon: ArrowUpDown,   title: 'Elevator out of service', desc: 'Bến Thành Station, Gate A — stairs only'       },
  { id: 3, severity: 'caution', icon: AlertTriangle, title: 'Ramp blocked',            desc: 'City Hall main entrance — use side entrance'   },
];

const ROUTE = {
  duration:   '18 min',
  mode:       'Bus + Walk',
  score:      92,
  from:       'Current location',
  to:         'City Hospital',
  highlights: ['Wheelchair ramp', 'No stairs', 'Sheltered stops'],
};

const NAV_ITEMS = [
  { icon: Home,     label: 'Home'    },
  { icon: Search,   label: 'Search'  },
  { icon: Map,      label: 'Routes'  },
  // { icon: Bookmark, label: 'Saved'   },
  { icon: User,     label: 'Profile' },
];

export default function HomePage() {
  const [search, setSearch] = useState('');

  return (
    <div className={styles.page}>

      <header className={styles.header}>
        <div className={styles.topRow}>
          <div>
            <p className={styles.hi}>Good morning</p>
            <h1 className={styles.name}>Huy</h1>
          </div>
          <button className={styles.avatarBtn} aria-label="Open profile">
            <User size={20} />
          </button>
        </div>
        <SearchBar
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Where would you like to go?"
        />
      </header>

      <main className={styles.main}>

        <section aria-labelledby="saved-title">
          <h2 id="saved-title" className={styles.sectionTitle}>Saved Places</h2>
          <div className={styles.quickRow}>
            {QUICK_PLACES.map(({ id, label, icon: Icon }) => (
              <button key={id} className={styles.placeChip} aria-label={`Go to ${label}`}>
                <Icon size={24} className={styles.placeIcon} aria-hidden="true" />
                <span className={styles.placeLabel}>{label}</span>
              </button>
            ))}
          </div>
        </section>

        <section aria-labelledby="recent-title">
          <h2 id="recent-title" className={styles.sectionTitle}>Recent</h2>
          <div className={styles.recentCard}>
            {RECENT.map((r, i) => (
              <button
                key={r.id}
                className={`${styles.recentRow} ${i < RECENT.length - 1 ? styles.recentBorder : ''}`}
              >
                <span className={styles.recentIconWrap}>
                  <Clock size={18} aria-hidden="true" />
                </span>
                <span className={styles.recentInfo}>
                  <span className={styles.recentName}>{r.name}</span>
                  <span className={styles.recentAddr}>{r.address}</span>
                </span>
                <span className={styles.recentTime}>{r.time}</span>
              </button>
            ))}
          </div>
        </section>

        <section aria-labelledby="alerts-title">
          <div className={styles.rowBetween}>
            <h2 id="alerts-title" className={styles.sectionTitle}>Accessibility Alerts</h2>
            <span className={styles.alertBadge} aria-label="3 active alerts">3</span>
          </div>
          <div className={styles.alertList}>
            {ALERTS.map(a => (
              <AlertCard key={a.id} {...a} />
            ))}
          </div>
        </section>

        <section aria-labelledby="route-title">
          <h2 id="route-title" className={styles.sectionTitle}>Recommended Route</h2>
          <RouteCard {...ROUTE} onStart={() => {}} />
        </section>

        <div className={styles.navSpacer} aria-hidden="true" />
      </main>

      <BottomNav items={NAV_ITEMS} activeLabel="Home" />

    </div>
  );
}
