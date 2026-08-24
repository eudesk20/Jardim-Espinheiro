/* MICROCOSMOS — descrições de Características da Classe na ficha.
   Usa primeiro dados locais; para as Classes em revisão consulta o Codex didático publicado. */
(function(){
  if(globalThis.MICROCOSMOS_CLASS_FEATURE_DETAILS_RUNTIME)return;
  globalThis.MICROCOSMOS_CLASS_FEATURE_DETAILS_RUNTIME=true;

  let classDocPromise=null;
  const normalize=s=>String(s||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[.]+$/g,"").trim().toLowerCase();

  async function loadClassDocument(){
    if(classDocPromise)return classDocPromise;
    classDocPromise=fetch("codex-revisao/classes-revisao.html",{cache:"force-cache"})
      .then(r=>{if(!r.ok)throw new Error(`HTTP ${r.status}`);return r.text()})
      .then(html=>new DOMParser().parseFromString(html,"text/html"))
      .catch(err=>{console.warn("MICROCOSMOS: não foi possível carregar descrições didáticas",err);return null});
    return classDocPromise
  }

  function localClassDescription(name){
    const wanted=normalize(name);
    // Progressões consolidadas do Bárbaro/Bardo já vivem na própria ficha.
    const rows=globalThis.CLASS_CODEX_PROGRESSIONS?.[state.cls]||[];
    const row=rows.find(([,title])=>normalize(title)===wanted||normalize(title).startsWith(wanted)||wanted.startsWith(normalize(title)));
    if(row?.[2])return `<p>${esc(row[2])}</p>`;
    const existing=globalThis.FEATURE_DESC?.[name];
    if(existing&&!/ainda não cadastrada|consulte/i.test(existing))return `<p>${esc(existing)}</p>`;
    return ""
  }

  function findDidacticDescription(doc,name){
    if(!doc)return "";
    const wanted=normalize(name),classId=state.cls||"";
    const root=doc.getElementById(classId)||doc;
    const features=[...root.querySelectorAll(".didactic-feature")];
    let best=features.find(box=>normalize(box.querySelector("h4")?.textContent)===wanted);
    if(!best)best=features.find(box=>{
      const h=normalize(box.querySelector("h4")?.textContent);
      return h&&wanted&&(h.startsWith(wanted)||wanted.startsWith(h))
    });
    if(!best)return "";
    const parts=[...best.querySelectorAll("p")].map(p=>p.innerHTML).filter(Boolean);
    return parts.join("")
  }

  globalThis.showFeature=async function(name,origin){
    const race=RACE_DATA[state.race],raceDetail=race?.featureDetails?.[name],subDetail=race?.subraceDetails?.[name];
    if(subDetail){
      const details=`<b>Características:</b> ${esc(subDetail.effect)}${subDetail.appearance?`<br><br><b>Aparência:</b> ${esc(subDetail.appearance)}`:""}${subDetail.culture?`<br><br><b>Cultura:</b> ${esc(subDetail.culture)}`:""}`;
      showPopup("📜 "+name,origin,details);return
    }
    if(raceDetail){showPopup("📜 "+name,origin,esc(raceDetail));return}

    const local=localClassDescription(name);
    if(local){showPopup("📜 "+name,origin,local);return}

    showPopup("📜 "+name,origin,"⏳ Carregando descrição da característica…");
    const doc=await loadClassDocument(),details=findDidacticDescription(doc,name);
    if(details){showPopup("📜 "+name,origin,details);return}

    showPopup("📜 "+name,origin,"Esta característica está vinculada à Classe, mas a descrição didática correspondente ainda não foi encontrada no Codex publicado.")
  };
})();
