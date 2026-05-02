import { ArrowRightIcon, InsertIcon, LinkIcon, SparkleIcon } from "@/components/Icon";

export function SuggestionsRail() {
  return (
    <div className="suggestions-rail">
      <div className="rail-head">
        <SparkleIcon size={12} />
        <span>Suggestions</span>
        <span className="count">3</span>
      </div>
      <div className="rail-body">
        <div className="rail-card">
          <div className="reason">You wrote about silence</div>
          <div className="ayah-q" dir="rtl" lang="ar">
            وَلَسَوْفَ يُعْطِيكَ رَبُّكَ فَتَرْضَىٰ
          </div>
          <div className="ayah-t">
            &ldquo;And your Lord is going to give you, and you will be satisfied.&rdquo;
          </div>
          <div className="body" style={{ fontStyle: "italic" }}>
            The next verse may answer the silence with a promise. Worth linking.
          </div>
          <div className="actions">
            <button type="button" className="btn ghost sm" style={{ flex: 1 }}>
              <LinkIcon size={11} /> Link 93:5
            </button>
          </div>
        </div>

        <div className="rail-card">
          <div className="reason">Related note · 6 days ago</div>
          <div className="body" style={{ fontFamily: "var(--font-serif)", fontSize: 13.5 }}>
            &ldquo;Reading &lsquo;qalā&rsquo; carefully&rdquo; — your earlier note explores the same
            word you used here.
          </div>
          <div className="actions">
            <button type="button" className="btn ghost sm" style={{ flex: 1 }}>
              <ArrowRightIcon size={11} /> Open note
            </button>
          </div>
        </div>

        <div className="rail-card">
          <div className="reason">Tafsir match · As-Saʿdī</div>
          <div className="body" style={{ fontStyle: "italic" }}>
            As-Saʿdī uses <em>tarbiyya</em> here — the same word you reached for. Consider citing.
          </div>
          <div className="actions">
            <button type="button" className="btn ghost sm" style={{ flex: 1 }}>
              <InsertIcon size={11} /> Insert
            </button>
          </div>
        </div>

        <div
          style={{
            padding: "14px 14px 0",
            fontSize: 11,
            color: "var(--color-ink-4)",
            textAlign: "center",
            fontStyle: "italic",
            fontFamily: "var(--font-serif)",
          }}
        >
          Suggestions update as you write.
        </div>
      </div>
    </div>
  );
}
