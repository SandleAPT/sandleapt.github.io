(function(){
  'use strict';
  const S=()=>window.SandleMeetingSource;

  function uniq(xs){ return [...new Set((xs||[]).map(x=>String(x||'').trim()).filter(Boolean))]; }
  function clean(s){ return String(s==null?'':s).trim(); }
  function bodyLabel(body){ return S()&&S().bodyLabel?S().bodyLabel(body):(body==='임차'?'임차인대표회의':'입주자대표회의'); }

  function autoTopics(agenda){
    const text=[agenda&&agenda.title,agenda&&agenda.summary,agenda&&agenda.decision,agenda&&agenda.followup].map(clean).join(' ');
    const defs=(window.TopicTaxonomy&&Array.isArray(window.TopicTaxonomy.defs))?window.TopicTaxonomy.defs:[];
    const hits=[];
    defs.forEach(def=>{
      if((def.kw||[]).some(k=>k&&text.toLowerCase().includes(String(k).toLowerCase()))) hits.push(def.key);
    });
    return uniq(hits.length?hits:['기타']);
  }

  function storedTopics(agenda){
    const raw=Array.isArray(agenda&&agenda.tags)&&agenda.tags.length?agenda.tags:(clean(agenda&&agenda.category)?[agenda.category]:[]);
    return uniq(raw);
  }

  function topicsFor(agenda){
    const stored=storedTopics(agenda);
    if(stored.length&&!(stored.length===1&&stored[0]==='기타')) return {topics:stored,source:'stored',confidence:98};
    const inferred=autoTopics(agenda);
    return {topics:inferred,source:'inferred',confidence:inferred[0]==='기타'?58:78};
  }

  function voteSummary(votes){
    const out={for:0,against:0,abstain:0,other:0,total:0};
    Object.values(votes||{}).forEach(v=>{
      out.total++;
      if(v==='for') out.for++;
      else if(v==='against') out.against++;
      else if(v==='abstain') out.abstain++;
      else out.other++;
    });
    return out;
  }

  function attendeeCount(state){
    const a=state&&state.meeting&&state.meeting.attendance||{};
    return Object.values(a).filter(Boolean).length;
  }

  function convert(parsed){
    const record=parsed.record||{};
    const state=parsed.state||{};
    const meeting=state.meeting||{};
    const body=meeting.body==='임차'?'임차':'입대의';
    const agendas=Array.isArray(state.agendas)?state.agendas:[];
    const docId='meeting:'+String(record.id||state.cloudId||meeting.date||Date.now());
    const sourceId=String(record.id||state.cloudId||'');
    const document={
      id:docId,
      record_class:'meeting',
      document_type:'회의록',
      title:clean(record.name||meeting.name)||`${meeting.date||''} ${bodyLabel(body)}`.trim(),
      document_date:clean(record.date||meeting.date),
      event_date:clean(meeting.date||record.date),
      effective_from:'',effective_to:'',
      temporal_status:'historical',
      scope:body==='임차'?'rental':'sale',
      primary_topic:'회의운영·민원',
      topics:['회의운영·민원'],
      organizations:[bodyLabel(body)],
      actions:[],
      source:{system:'minutes',id:sourceId,year:String(meeting.year||clean(record.date).slice(0,4)),url:'/minutes/#archiveView'},
      provenance:'explicit',
      visibility:'public',
      meeting:{body,term_no:meeting.termNo||null,type:meeting.type||'',time:meeting.time||'',place:meeting.place||'',attendee_count:attendeeCount(state),guest_count:Array.isArray(meeting.guests)?meeting.guests.length:0,audience_count:Number(meeting.audience&&meeting.audience.count)||0},
      fragment_count:agendas.length
    };

    const fragments=agendas.map((a,index)=>{
      const tp=topicsFor(a||{});
      const id=`${docId}:agenda:${clean(a&&a.id)||index+1}`;
      const decision=clean(a&&a.decision);
      const followup=clean(a&&a.followup);
      const actions=[];
      if(decision) actions.push({type:'decision',text:decision,evidence:'explicit'});
      if(followup) actions.push({type:'follow_up',text:followup,evidence:'explicit'});
      return {
        id,parent_document_id:docId,record_class:'meeting_agenda',document_type:'회의·안건',sequence:index+1,
        title:clean(a&&a.title)||`안건 ${index+1}`,
        summary:clean(a&&a.summary),decision,followup,
        topics:tp.topics,topic_source:tp.source,topic_confidence:tp.confidence,
        organization:bodyLabel(body),
        event_date:document.event_date,
        scope:document.scope,visibility:'public',
        vote:voteSummary(a&&a.votes),
        remarks:a&&a.remarks||{},
        is_other:!!(a&&a.isOther),
        actions,
        relations:[{type:'part_of',to:docId,evidence:'explicit'}],
        source:{system:'minutes',meeting_id:sourceId,agenda_id:clean(a&&a.id)||String(index+1)},
        provenance:{structure:'explicit',topics:tp.source}
      };
    });

    const warnings=[];
    if(!document.document_date) warnings.push('회의 날짜가 비어 있어.');
    if(!fragments.length) warnings.push('안건이 없는 회의록이야.');
    const inferred=fragments.filter(f=>f.topic_source==='inferred').length;
    if(inferred) warnings.push(`${inferred}개 안건의 주제는 기존 저장 태그가 없어 키워드 후보로 표시했어.`);
    const noDecision=fragments.filter(f=>!f.decision).length;
    if(noDecision) warnings.push(`${noDecision}개 안건은 의결사항이 비어 있어.`);
    return {document,fragments,warnings,sourceRecord:record,sourceState:state};
  }

  function toAdminDrafts(conversion){
    const doc=conversion.document;
    return conversion.fragments.map(f=>({
      id:'import-'+f.id.replace(/[^a-zA-Z0-9:_-]/g,'_'),
      sample:false,importedMeeting:true,
      title:f.title,documentType:'회의·안건',date:doc.document_date,scope:doc.scope,
      source:`minutes:${doc.source.id} / agenda:${f.source.agenda_id}`,
      note:[f.summary,f.decision?`의결: ${f.decision}`:'',f.followup?`후속: ${f.followup}`:''].filter(Boolean).join('\n\n'),
      visibility:'public',
      suggestions:{topic:f.topics[0]||'기타',organization:f.organization,temporalStatus:'historical',confidence:f.topic_confidence},
      classificationApproved:false,classificationHeld:false,
      relation:{target:doc.title,type:'part_of',evidence:'explicit',approved:true,skipped:false},
      published:false,
      archive:{document:doc,fragment:f}
    }));
  }

  window.SandleMeetingAdapter={convert,toAdminDrafts,autoTopics,topicsFor,voteSummary};
})();
