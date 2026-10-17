import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  ShieldCheck, Search, FileCheck2, ScanSearch, ClipboardCheck, ArrowRight,
  AlertTriangle, MapPin, Database, Activity, Menu, X, ChevronRight,
  CheckCircle2, CircleHelp, FileText, Landmark, Eye, RefreshCw, ExternalLink
} from "lucide-react";
import "./styles.css";


const API = "https://landguard-ai-sr4a.vercel.app";

const money = (n) => new Intl.NumberFormat("en-BD").format(n || 0);

function App() {
  const [summary, setSummary] = useState(null);
  const [parcels, setParcels] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedModule, setSelectedModule] = useState("ALL");
  const [selectedParcel, setSelectedParcel] = useState(null);
  const [detail, setDetail] = useState(null);
  const [checkId, setCheckId] = useState("LP-0001");
  const [checkResult, setCheckResult] = useState(null);
  const [error, setError] = useState("");
  const [mobileNav, setMobileNav] = useState(false);
  const [activeSection, setActiveSection] = useState("overview");
  const [language, setLanguage] = useState("bn");
  const [showLogin, setShowLogin] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginMessage, setLoginMessage] = useState("");

  const isBn = language === "bn";
  const t = (bn, en) => isBn ? bn : en;

  async function loadData() {
    setError("");
    try {
      const [s, p, a] = await Promise.all([
        fetch(`${API}/api/summary`).then(r => { if (!r.ok) throw new Error("API unavailable"); return r.json(); }),
        fetch(`${API}/api/parcels?limit=200`).then(r => r.json()),
        fetch(`${API}/api/alerts?limit=100`).then(r => r.json())
      ]);
      setSummary(s); setParcels(p); setAlerts(a);
    } catch (e) {
      setError("Backend API-তে সংযোগ হচ্ছে না। README-এর নির্দেশনা অনুযায়ী FastAPI চালু করে Refresh করো।");
    }
  }

  useEffect(() => { loadData(); }, []);

  async function openParcel(id) {
    setSelectedParcel(id);
    setDetail(null);
    try {
      const response = await fetch(`${API}/api/parcels/${id}`);
      if (!response.ok) throw new Error("Parcel not found");
      setDetail(await response.json());
    } catch {
      setError("এই parcel-এর detail লোড করা যায়নি। Backend চালু আছে কি না দেখো।");
    }
  }

  async function runCheck(e) {
    e.preventDefault();
    setCheckResult(null);
    try {
      const response = await fetch(`${API}/api/check`, {
        method: "POST", headers: {"Content-Type":"application/json"},
        body: JSON.stringify({parcel_id: checkId.trim().toUpperCase()})
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "Check failed");
      setCheckResult(data);
    } catch (e) {
      setCheckResult({error: e.message || "Check failed"});
    }
  }

  const filteredParcels = useMemo(() => parcels.filter(p => {
    const term = search.toLowerCase();
    return !term || [p.parcel_id, p.district, p.dag_number, p.khatian_number, p.current_owner, p.mouza]
      .some(v => String(v || "").toLowerCase().includes(term));
  }), [parcels, search]);

  const filteredAlerts = useMemo(() => alerts.filter(a => selectedModule === "ALL" || a.module === selectedModule), [alerts, selectedModule]);
  const totalAlerts = summary?.counts?.risk_alerts ?? "—";
  const highAlerts = summary?.alerts_by_severity?.find(x => x.severity === "high")?.count ?? 0;

  function goTo(id) {
    setActiveSection(id);
    setMobileNav(false);
    document.getElementById(id)?.scrollIntoView({behavior:"smooth", block:"start"});
  }

  if (showLogin) {
    return <div className="login-shell" lang={isBn ? "bn" : "en"}>
      <div className="login-language">
        <button className={isBn ? "lang-active" : ""} onClick={() => setLanguage("bn")}>বাংলা</button>
        <button className={!isBn ? "lang-active" : ""} onClick={() => setLanguage("en")}>English</button>
      </div>
      <div className="login-card">
        <div className="login-brand"><div className="brand-icon"><ShieldCheck size={25}/></div><div><strong>LandGuard<span> AI</span></strong><small>{t("জমি যাচাই ও ঝুঁকি বিশ্লেষণ","LAND VERIFICATION & RISK INTELLIGENCE")}</small></div></div>
        <div className="login-eyebrow">{t("নিরাপদ ও সহজ জমি যাচাই","SMART LAND CHECK")}</div>
        <h1>{t("আপনার অ্যাকাউন্টে প্রবেশ করুন","Welcome back")}</h1>
        <p className="login-subtitle">{t("আপনার জমির তথ্য, যাচাই এবং ঝুঁকি প্রতিবেদন এক জায়গায় দেখুন।","Access parcel checks, verification tools, and risk reports in one workspace.")}</p>
        <form onSubmit={(e) => { e.preventDefault(); setLoginMessage(t("ডেমো মোডে লগইন সফল। এটি প্রকৃত অ্যাকাউন্ট যাচাই করে না।","Demo sign-in successful. No real account authentication was performed.")); setLoggedIn(true); setTimeout(() => setShowLogin(false), 700); }}>
          <label>{t("ইমেইল ঠিকানা","Email address")}</label>
          <input type="email" value={loginEmail} onChange={e=>setLoginEmail(e.target.value)} placeholder={t("আপনার ইমেইল লিখুন","you@example.com")} required />
          <label>{t("পাসওয়ার্ড","Password")}</label>
          <input type="password" value={loginPassword} onChange={e=>setLoginPassword(e.target.value)} placeholder={t("পাসওয়ার্ড লিখুন","Enter password")} required minLength={4}/>
          <button className="btn-primary login-submit" type="submit">{t("লগইন করুন","Sign in")} <ArrowRight size={17}/></button>
          {loginMessage && <div className="login-message"><CheckCircle2 size={16}/>{loginMessage}</div>}
        </form>
        <div className="login-divider"><span>{t("অথবা","OR")}</span></div>
        <button className="btn-secondary login-guest" onClick={()=>{setLoggedIn(false);setShowLogin(false);}}>{t("লগইন ছাড়া ডেমো দেখুন","Continue to demo without signing in")}</button>
        <div className="login-disclaimer"><AlertTriangle size={15}/>{t("এটি হ্যাকাথন ডেমো লগইন; এখনো প্রকৃত Authentication বা ব্যবহারকারী ডেটাবেস যুক্ত হয়নি।","This is a hackathon demo login UI. Real authentication and user storage are not configured.")}</div>
        <button className="back-home" onClick={()=>setShowLogin(false)}>← {t("হোমপেজে ফিরে যান","Back to home")}</button>
      </div>
    </div>;
  }

  return <div className="app-shell" lang={isBn ? "bn" : "en"}>
    <aside className={`sidebar ${mobileNav ? "sidebar-open" : ""}`}>
      <div className="brand"><div className="brand-icon"><ShieldCheck size={23}/></div><div><strong>LandGuard<span> AI</span></strong><small>{t("জমির ঝুঁকি বিশ্লেষণ","LAND RISK INTELLIGENCE")}</small></div></div>
      <div className="workspace-label">{t("কর্মক্ষেত্র","WORKSPACE")}</div>
      <nav>
        {[["overview",t("সারসংক্ষেপ","Overview"),Activity],["verify",t("জমি যাচাই","Verify a parcel"),ScanSearch],["parcels",t("জমির রেকর্ড","Land records"),MapPin],["alerts",t("ঝুঁকি সতর্কতা","Risk alerts"),AlertTriangle],["how-it-works",t("যেভাবে কাজ করে","How it works"),CircleHelp]].map(([id,label,Icon]) =>
          <button key={id} className={`nav-link ${activeSection===id?"active":""}`} onClick={()=>goTo(id)}><Icon size={18}/><span>{label}</span>{id==="alerts" && <em>{totalAlerts}</em>}</button>
        )}
      </nav>
      <div className="sidebar-bottom">
        <div className="demo-badge"><span className="pulse"></span> {t("সিনথেটিক ডেমো পরিবেশ","Synthetic demo environment")}</div>
        <p>{t("সরকারি ভূমি ব্যবস্থার সঙ্গে সংযুক্ত নয়।","Not connected to government land systems.")}</p>
       <a href="https://landguard-ai-sr4a.vercel.app/docs" target="_blank" rel="noreferrer">{t("API ডকুমেন্টেশন","API documentation")} <ExternalLink size={13}/></a>
      </div>
    </aside>

    <main className="main-content">
      <header className="topbar">
        <button className="mobile-menu" onClick={()=>setMobileNav(!mobileNav)} aria-label="Toggle navigation">{mobileNav?<X/>:<Menu/>}</button>
        <div className="breadcrumb">{t("কর্মক্ষেত্র","Workspace")} <ChevronRight size={14}/> <b>{t("ভূমি তথ্য বিশ্লেষণ","Land intelligence")}</b></div>
        <div className="top-actions"><button className={`language-switch ${isBn ? "selected" : ""}`} onClick={()=>setLanguage("bn")}>বাংলা</button><button className={`language-switch ${!isBn ? "selected" : ""}`} onClick={()=>setLanguage("en")}>EN</button><button className="login-nav" onClick={()=>setShowLogin(true)}>{t("লগইন","Login")}</button><span className="status-dot"></span><span>{t("ডেমো সিস্টেম","Demo system")}</span><button className="icon-button" onClick={loadData} title={t("রিফ্রেশ","Refresh")}><RefreshCw size={17}/></button></div>
      </header>

      <div className="page-wrap">
        {error && <div className="error-banner"><AlertTriangle size={18}/><span>{error}</span><button onClick={loadData}>Retry</button></div>}
        <section className="hero" id="overview">
          <div className="hero-copy">
            <div className="eyebrow"><span></span> {t("ভূমি রেকর্ড · ঝুঁকি বিশ্লেষণ","LAND RECORDS · RISK INTELLIGENCE")}</div>
            <h1>{t("জমি সংক্রান্ত","Make every land")}<br/><span>{t("সিদ্ধান্ত হোক আরও পরিষ্কার।","decision clearer.")}</span></h1>
            <p>{t("দলিলের অসংগতি যাচাই, একই জমি একাধিকবার বিক্রির সম্ভাব্য সংকেত শনাক্ত এবং জমি কেনার আগের ঝুঁকি যাচাই—সবকিছু এক জায়গায়।","One workspace to review deed inconsistencies, identify possible duplicate-sale signals, and prepare a pre-purchase risk checklist.")}</p>
            <div className="hero-actions"><button className="btn-primary" onClick={()=>goTo("verify")}>{t("জমি যাচাই করুন","Check a parcel")} <ArrowRight size={17}/></button><button className="btn-secondary" onClick={()=>goTo("how-it-works")}>{t("প্ল্যাটফর্ম দেখুন","Explore platform")}</button></div>
            <div className="trust-row"><span><CheckCircle2 size={15}/> {t("ব্যাখ্যাসহ সতর্কতা","Explainable alerts")}</span><span><CheckCircle2 size={15}/> {t("যাচাই-প্রথম পদ্ধতি","Review-first workflow")}</span></div>
          </div>
          <div className="hero-visual">
            <div className="visual-grid"></div>
            <div className="floating-card card-main">
              <div className="card-head"><div className="mini-icon"><ShieldCheck size={18}/></div><span>{t("ল্যান্ডগার্ড স্ক্যান","LANDGUARD SCAN")}</span><span className="live-pill">DEMO</span></div>
              <div className="scan-title">{t("জমির ঝুঁকির সারসংক্ষেপ","Parcel risk overview")}</div>
              <div className="scan-id"><MapPin size={15}/> LP-0007 <span>· {t("কাল্পনিক রেকর্ড","Synthetic record")}</span></div>
              <div className="risk-meter"><div className="meter-label"><span>{t("যাচাইয়ের অগ্রাধিকার","Review priority")}</span><b>HIGH</b></div><div className="meter-track"><i></i></div></div>
              <div className="scan-alert"><AlertTriangle size={17}/><div><b>{t("দলিলের তথ্যে বিরোধ","Conflicting deed signals")}</b><small>{t("ম্যানুয়াল যাচাই প্রয়োজন","Requires manual verification")}</small></div></div>
              <div className="scan-foot"><span>{t("শুধু উদাহরণমূলক ডেমো","Illustrative demo only")}</span><span>01 / 03</span></div>
            </div>
            <div className="floating-card card-side"><div className="side-icon"><FileCheck2 size={17}/></div><div><b>{t("দলিল তুলনা","Deed comparison")}</b><small>{t("রেকর্ডের অমিল যাচাই","Record mismatch checks")}</small></div><CheckCircle2 size={18} className="green"/></div>
            <div className="orb orb-one"></div><div className="orb orb-two"></div>
          </div>
        </section>

        <section className="stats-grid">
          <Stat icon={MapPin} label={t("জমির রেকর্ড","Land parcels")} value={summary?.counts?.land_parcels} note={t("কাল্পনিক জমির রেকর্ড","Fictional parcel records")} />
          <Stat icon={FileText} label={t("দলিলের রেকর্ড","Deed records")} value={summary?.counts?.deeds} note={t("সংযুক্ত দলিলের ইতিহাস","Linked deed history")} />
          <Stat icon={AlertTriangle} label={t("ঝুঁকি সতর্কতা","Risk alerts")} value={totalAlerts} note={t("যাচাই প্রয়োজন এমন সংকেত","Signals needing review")} accent />
          <Stat icon={Activity} label={t("উচ্চ অগ্রাধিকারের সংকেত","High-priority signals")} value={highAlerts} note={t("এটি আইনি সিদ্ধান্ত নয়","Not a legal finding")} />
        </section>

        <section className="section-block" id="verify">
          <SectionHeading eyebrow={t("এখান থেকে শুরু করুন","START HERE")} title={t("জমি যাচাই করুন","Check a parcel")} subtitle={t("কাল্পনিক জমির ID লিখে ঝুঁকির সংকেত ও সংশ্লিষ্ট রেকর্ড দেখুন।","Enter a synthetic parcel ID to see the available risk signals and related records.")} />
          <div className="verify-panel">
            <div className="verify-info"><div className="big-icon"><ScanSearch size={25}/></div><h3>{t("ঝুঁকি যাচাই চালান","Run a risk check")}</h3><p>{t("এই ডেমো SQLite-এ থাকা কাল্পনিক রেকর্ড যাচাই করে। এটি সরকারি ভূমি রেকর্ডে অনুসন্ধান করে না।","This demo checks the generated SQLite records. It does not query an official land registry.")}</p><div className="check-points"><span><CheckCircle2/> {t("দলিলের সামঞ্জস্য","Deed consistency")}</span><span><CheckCircle2/> {t("একাধিক বিক্রির সম্ভাবনা","Possible duplicate sales")}</span><span><CheckCircle2/> {t("কেনার আগের ঝুঁকি","Pre-purchase risk flags")}</span></div></div>
            <form className="verify-form" onSubmit={runCheck}>
              <label htmlFor="parcel-id">{t("কাল্পনিক জমির ID","Synthetic parcel ID")}</label>
              <div className="input-row"><div className="input-wrap"><Search size={18}/><input id="parcel-id" value={checkId} onChange={e=>setCheckId(e.target.value)} placeholder={t("যেমন: LP-0001","e.g. LP-0001")} required/></div><button className="btn-primary" type="submit">{t("যাচাই করুন","Run check")} <ArrowRight size={16}/></button></div>
              <div className="input-hint">{t("LP-0001, LP-0007 অথবা জমির রেকর্ডের যেকোনো ID ব্যবহার করুন।", "Try LP-0001, LP-0007, or any ID from the Land records section.")}</div>
              {checkResult && <div className={`check-result ${checkResult.error ? "has-error" : ""}`}>
                {checkResult.error ? <><AlertTriangle/><div><b>{t("যাচাই সম্পন্ন করা যায়নি", "Could not complete check")}</b><p>{checkResult.error === "Failed to fetch" ? t("সার্ভারের সঙ্গে সংযোগ হচ্ছে না। Backend চালু আছে কি না দেখুন।", "Could not connect to the server. Check that the backend is running.") : checkResult.error}</p></div></> : <>
                  <div className="result-top"><div><small>{t("জমির পরিচিতি", "PARCEL")}</small><h4>{checkResult.parcel_id}</h4></div><span className={`risk-pill ${checkResult.overall_risk}`}>{t(checkResult.overall_risk === "high" ? "উচ্চ ঝুঁকি" : checkResult.overall_risk === "medium" ? "মাঝারি ঝুঁকি" : "কম ঝুঁকি", `${checkResult.overall_risk.toUpperCase()} RISK`)}</span></div>
                  <p>{isBn ? `কাল্পনিক ডেটাসেটে ${checkResult.alert_count}টি ঝুঁকির সংকেত পাওয়া গেছে।` : `${checkResult.alert_count} risk signal(s) found in the synthetic dataset.`}</p>
                  {checkResult.alerts.slice(0,4).map(a=><div className="result-alert" key={a.alert_id}><AlertTriangle size={15}/><span>{a.title}</span><b>{a.severity}</b></div>)}
                  <small className="disclaimer">{t("এটি শুধু কাল্পনিক ডেটার ডেমো ফলাফল। সরকারি যাচাই বা আইনি মতামত নয়।", checkResult.disclaimer)}</small>
                </>}
              </div>}
            </form>
          </div>
        </section>

        <section className="section-block" id="parcels">
          <SectionHeading eyebrow={t("কাল্পনিক রেকর্ড","SYNTHETIC RECORDS")} title={t("জমির রেকর্ড অনুসন্ধান","Land records explorer")} subtitle={t("ডেমো ডেটাসেটে খুঁজুন এবং জমি খুলে দলিল, ইতিহাস ও ঝুঁকি সতর্কতা দেখুন।","Search the demo dataset and open a parcel to inspect its linked deeds, history, and risk alerts.")} />
          <div className="table-panel">
            <div className="table-toolbar"><div><b>{t("জমির তালিকা","Parcel registry")}</b><span>{filteredParcels.length} {t("টি রেকর্ড","records shown")}</span></div><div className="search-field"><Search size={17}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder={t("জমি, মালিক বা দাগ নম্বর খুঁজুন...","Search parcel, owner, dag...")} /></div></div>
            <div className="table-scroll"><table><thead><tr><th>{t("জমির ID","Parcel ID")}</th><th>{t("অবস্থান","Location")}</th><th>{t("দাগ / খতিয়ান","Dag / Khatian")}</th><th>{t("পরিমাণ","Area")}</th><th>{t("বর্তমান মালিক (ডেমো)","Current owner (demo)")}</th><th>{t("সতর্কতা","Alerts")}</th><th></th></tr></thead><tbody>
              {filteredParcels.slice(0,30).map(p=><tr key={p.parcel_id}><td><b className="parcel-code">{p.parcel_id}</b></td><td><span>{p.district}</span><small>{p.mouza}</small></td><td><span>{p.dag_number}</span><small>{p.khatian_number}</small></td><td>{p.area_decimal} dec.</td><td>{p.current_owner}</td><td><span className={`count-badge ${p.alert_count ? "has-alert" : ""}`}>{p.alert_count}</span></td><td><button className="view-button" onClick={()=>openParcel(p.parcel_id)} aria-label={`View ${p.parcel_id}`}><Eye size={16}/></button></td></tr>)}
              {!filteredParcels.length && <tr><td colSpan="7" className="empty">{t("মিল পাওয়া যায়নি।","No matching synthetic records found.")}</td></tr>}
            </tbody></table></div>
            <div className="table-foot">{t("সর্বোচ্চ ৩০টি মিলযুক্ত রেকর্ড দেখানো হচ্ছে। সব নাম ও পরিচিতি কাল্পনিক।","Showing up to 30 matching records. All names and identifiers are fictional.")}</div>
          </div>
          {selectedParcel && <div className="detail-panel">
            <div className="detail-header"><div><div className="eyebrow">PARCEL DETAILS</div><h3>{selectedParcel}</h3></div><button className="close-detail" onClick={()=>{setSelectedParcel(null);setDetail(null)}}><X size={18}/></button></div>
            {!detail ? <p>Loading parcel details…</p> : <>
              <div className="detail-facts"><Fact label="Current owner" value={detail.parcel.current_owner}/><Fact label="District" value={detail.parcel.district}/><Fact label="Area" value={`${detail.parcel.area_decimal} decimal`}/><Fact label="Land type" value={detail.parcel.land_type}/></div>
              <h4>Risk alerts ({detail.alerts.length})</h4>
              {detail.alerts.length ? detail.alerts.map(a=><div className="detail-alert" key={a.alert_id}><span className={`severity-dot ${a.severity}`}></span><div><b>{a.title}</b><p>{a.explanation}</p><small>{a.module} · {a.alert_type}</small></div></div>) : <p>No alerts are attached to this synthetic parcel.</p>}
              <h4>Deed records ({detail.deeds.length})</h4>
              <div className="mini-table"><table><thead><tr><th>Deed</th><th>Seller</th><th>Buyer</th><th>Date</th><th>Area</th></tr></thead><tbody>{detail.deeds.map(d=><tr key={d.deed_id}><td>{d.deed_number}</td><td>{d.seller_name}</td><td>{d.buyer_name}</td><td>{d.deed_date}</td><td>{d.deed_area_decimal}</td></tr>)}</tbody></table></div>
              <div className="detail-columns"><div><h4>Mutation</h4>{detail.mutations.map(m=><p key={m.mutation_id}><b>{m.status}</b> — {m.notes}</p>)}</div><div><h4>Legal cases</h4>{detail.cases.length ? detail.cases.map(c=><p key={c.case_id}><b>{c.case_status}</b> — {c.case_type}</p>) : <p>No synthetic case record.</p>}</div></div>
            </>}
          </div>}
        </section>

        <section className="section-block" id="alerts">
          <SectionHeading eyebrow={t("ব্যাখ্যাসহ সংকেত","EXPLAINABLE SIGNALS")} title={t("ঝুঁকি সতর্কতা কেন্দ্র","Risk alert centre")} subtitle={t("প্রতিটি সতর্কতার সঙ্গে কারণ দেওয়া আছে। এগুলো নিয়মভিত্তিক ডেমো সংকেত, নিশ্চিত জালিয়াতি নয়।","Every alert includes a reason to support review. These are rules-based demo signals, not confirmed fraud.")} />
          <div className="alert-toolbar"><div className="filter-tabs">{["ALL","P2","P3","P5"].map(m=><button key={m} className={selectedModule===m?"selected":""} onClick={()=>setSelectedModule(m)}>{m==="ALL"?t("সব মডিউল","All modules"):m}</button>)}</div><span>{filteredAlerts.length} alerts</span></div>
          <div className="alert-grid">{filteredAlerts.slice(0,12).map(a=><article className="alert-card" key={a.alert_id}><div className="alert-card-top"><span className={`module-tag ${a.module.toLowerCase()}`}>{a.module}</span><span className={`risk-pill ${a.severity}`}>{a.severity}</span></div><h3>{a.title}</h3><p>{a.explanation}</p><div className="alert-card-bottom"><span><MapPin size={14}/>{a.parcel_id}</span><button onClick={()=>{openParcel(a.parcel_id);goTo("parcels")}}>{t("জমি দেখুন","Inspect parcel")} <ArrowRight size={14}/></button></div></article>)}</div>
        </section>

        <section className="section-block" id="how-it-works">
          <SectionHeading eyebrow={t("তিনটি মডিউল · একটি প্ল্যাটফর্ম","THREE MODULES · ONE WORKSPACE")} title={t("রেকর্ড যাচাই থেকে পরবর্তী করণীয় স্পষ্ট করুন।","From record comparison to a clearer next step.")} subtitle={t("তিনটি সমস্যা ক্ষেত্রকে একটি ব্যাখ্যাযোগ্য যাচাই প্রক্রিয়ায় একত্র করা হয়েছে।","The prototype combines three problem areas into one explainable review workflow.")} />
          <div className="module-grid">
            <ModuleCard number="P2" icon={FileCheck2} title={t("দলিল যাচাই","DeedVerify")} desc={t("দলিলের তথ্যের সঙ্গে জমির রেকর্ড মিলিয়ে পরিমাণ বা বিক্রেতার অমিল শনাক্ত করুন।","Compare deed details with parcel records and surface area or seller mismatches.")} bullets={isBn?["জমির পরিমাণে অমিল","বিক্রেতা ও রেকর্ডকৃত মালিকের অমিল","সহজ ভাষায় ব্যাখ্যা"]:["Area mismatch signals","Seller vs. recorded owner","Readable explanations"]}/>
            <ModuleCard number="P3" icon={ScanSearch} title={t("জালিয়াতির সংকেত","LandGuard AI")} desc={t("একই জমি একাধিকবার বিক্রি ও পরস্পরবিরোধী দলিলের সম্ভাব্য সংকেত খুঁজুন।","Find possible duplicate-sale patterns and conflicting registered deed signals.")} bullets={isBn?["একই জমি/অংশের পুনরাবৃত্তি","বিরোধপূর্ণ দলিলের ইতিহাস","যাচাইয়ের অগ্রাধিকার"]:["Repeated parcel/share checks","Conflicting deed history","Review-priority flags"]}/>
            <ModuleCard number="P5" icon={ClipboardCheck} title={t("ক্রয়ের আগে যাচাই","LandCheck AI")} desc={t("নামজারি, মামলা ও অধিগ্রহণের সংকেত একত্র করে ক্রয়ের আগের চেকলিস্ট তৈরি করুন।","Bring together mutation, legal-case, and acquisition flags for a pre-purchase checklist.")} bullets={isBn?["অপেক্ষমাণ নামজারি","কাল্পনিক মামলার সংকেত","অধিগ্রহণের অবস্থা যাচাই"]:["Pending mutation","Fictional legal-case flags","Acquisition status review"]}/>
          </div>
        </section>

        <section className="section-block how-section">
          <div className="how-layout"><div><div className="eyebrow">{t("যেভাবে কাজ করে","HOW IT WORKS")}</div><h2>{t("স্বচ্ছ ও যাচাই-প্রথম প্রক্রিয়া।","A transparent, review-first workflow.")}</h2><p>{t("LandGuard AI রেকর্ডের অসংগতি আগে থেকে চিহ্নিত করতে সাহায্য করে। কেন সতর্কতা এসেছে তা ব্যাখ্যা করে; চূড়ান্ত সরকারি যাচাই ও আইনি সিদ্ধান্ত অনুমোদিত পেশাজীবীদের জন্য রাখা হয়।","LandGuard AI highlights inconsistencies and explains why, while leaving official verification and legal conclusions to authorized professionals.")}</p><button className="btn-primary" onClick={()=>goTo("verify")}>{t("কাল্পনিক জমি পরীক্ষা করুন","Try a synthetic parcel")} <ArrowRight size={16}/></button></div>
            <div className="steps"><Step n="01" title={t("জমি নির্বাচন করুন","Select a parcel")} text={t("কাল্পনিক জমির ID, দাগ, খতিয়ান, মৌজা বা মালিকের নাম দিয়ে খুঁজুন।","Search by synthetic parcel ID, dag, khatian, mouza, or owner name.")}/><Step n="02" title={t("সংযুক্ত রেকর্ড তুলনা করুন","Compare linked records")} text={t("নিয়মভিত্তিক যাচাই দলিলের পরিমাণ, বিক্রেতার তথ্য, একাধিক বিক্রির সংকেত ও ঝুঁকির রেকর্ড পরীক্ষা করে।","Rule-based checks inspect deed area, seller consistency, duplicate-sale signals, and risk records.")}/><Step n="03" title={t("কারণগুলো পর্যালোচনা করুন","Review the reasons")} text={t("প্রতিটি সতর্কতায় ব্যাখ্যা ও মডিউল দেওয়া থাকে, যাতে পরবর্তী যাচাইয়ের সিদ্ধান্ত নেওয়া যায়।","Each alert contains an explanation and a module label so a reviewer can decide what to verify next.")}/></div>
          </div>
        </section>

        <section className="section-block limitations">
          <div className="limit-icon"><Landmark size={23}/></div><div><div className="eyebrow">{t("গুরুত্বপূর্ণ সীমাবদ্ধতা","IMPORTANT LIMITATIONS")}</div><h3>{t("ডেমো ডেটা সরকারি জমি যাচাই নয়।","Demo data is not official land verification.")}</h3><p>{t("সব রেকর্ড হ্যাকাথন প্রোটোটাইপের জন্য তৈরি কাল্পনিক তথ্য। কোনো সরকারি রেজিস্ট্রির সঙ্গে সংযোগ নেই। High Risk মানেই জালিয়াতির প্রমাণ নয়, Low Risk মানেই জমি কেনা নিরাপদ—এমন নিশ্চয়তাও নয়। বাস্তব ব্যবহারে অনুমোদিত তথ্যসূত্র, গোপনীয়তা ও নিরাপত্তা নিয়ন্ত্রণ এবং মানবীয়/আইনি যাচাই প্রয়োজন।","All records are synthetic and generated for a hackathon prototype. No government registry is connected. A high-risk signal does not prove fraud, and a low-risk result does not guarantee a property is safe to buy. Real use requires authorized records, data provenance, privacy/security controls, and human/legal review.")}</p></div>
        </section>
        <footer><div className="footer-brand"><ShieldCheck size={19}/> LandGuard AI</div><span>{t("হ্যাকাথন প্রোটোটাইপ · শুধু কাল্পনিক ডেটা","Hackathon prototype · Synthetic data only")}</span><button onClick={()=>window.scrollTo({top:0,behavior:"smooth"})}>{t("উপরে যান ↑","Back to top ↑")}</button></footer>
      </div>
    </main>
  </div>;
}

function Stat({icon:Icon,label,value,note,accent}) { return <div className="stat-card"><div className={`stat-icon ${accent?"accent":""}`}><Icon size={20}/></div><div className="stat-label">{label}</div><div className="stat-value">{value ?? "—"}</div><div className="stat-note">{note}</div></div>; }
function SectionHeading({eyebrow,title,subtitle}) { return <div className="section-heading"><div className="eyebrow">{eyebrow}</div><h2>{title}</h2><p>{subtitle}</p></div>; }
function Fact({label,value}) { return <div className="fact"><small>{label}</small><b>{value || "—"}</b></div>; }
function ModuleCard({number,icon:Icon,title,desc,bullets}) { return <article className="module-card"><div className="module-card-head"><span className={`module-tag ${number.toLowerCase()}`}>{number}</span><div className="module-icon"><Icon size={21}/></div></div><h3>{title}</h3><p>{desc}</p><ul>{bullets.map(x=><li key={x}><CheckCircle2 size={15}/>{x}</li>)}</ul></article>; }
function Step({n,title,text}) { return <div className="step"><div className="step-number">{n}</div><div><h3>{title}</h3><p>{text}</p></div></div>; }

createRoot(document.getElementById("root")).render(<App />);
