/* MICROCOSMOS — atualização estável das gavetas dinâmicas do Mestre.
   Aprovações e Descanso consultam o Supabase em tempo real. Durante essas consultas
   o organizador escreve estados temporários de "Carregando..." e, mesmo quando os
   dados não mudaram, pode substituir todo o conteúdo novamente. Isso cria o efeito
   visual de piscar. Este runtime mantém o conteúdo atual enquanto a consulta ocorre
   e ignora reescritas idênticas.
*/
(function(){
  if(globalThis.MICROCOSMOS_MASTER_STABLE_REFRESH)return;
  globalThis.MICROCOSMOS_MASTER_STABLE_REFRESH=true;

  const descriptor=Object.getOwnPropertyDescriptor(Element.prototype,"innerHTML");
  if(!descriptor?.get||!descriptor?.set||descriptor.configurable===false)return;

  const isTarget=el=>{
    if(!el?.classList?.contains("micro-master-section-body"))return false;
    const section=el.parentElement;
    return section?.id==="microMasterApprovalSection"||section?.id==="microMasterRestSection";
  };

  const isTransientLoading=html=>/Carregando aprovações pendentes|Carregando personagens/i.test(String(html||""));

  Object.defineProperty(Element.prototype,"innerHTML",{
    configurable:descriptor.configurable,
    enumerable:descriptor.enumerable,
    get:descriptor.get,
    set(value){
      if(!isTarget(this))return descriptor.set.call(this,value);

      const next=String(value??"");
      const current=descriptor.get.call(this);

      /* Mantém a tela antiga enquanto a nova consulta está acontecendo. */
      if(isTransientLoading(next)&&current.trim()&&!isTransientLoading(current))return;

      /* Se o resultado é exatamente o mesmo, não destrói/recria o DOM. */
      if(next===current)return;

      return descriptor.set.call(this,value);
    }
  });
})();
