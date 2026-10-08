import{c as e,i as t}from"./preload-helper-D2yxXLVK.js";import{t as n}from"./react-DAMDAfNa.js";import{t as r}from"./jsx-runtime-Dwpk6tgA.js";import{E as i,O as a}from"./iframe-6L4Now2U.js";import{n as o,t as s}from"./Stack-Blj2xom2.js";import{n as c,t as l}from"./Box-BXhq5WKP.js";import{n as u,t as d}from"./Typography-CWKirwdW.js";import{n as f,t as p}from"./SoftCard-SvW6_ybX.js";import{c as m,i as h}from"./paths-D7uT-HPS.js";import{n as g,t as _}from"./CircularProgress-CIp3Gv75.js";import{n as v,t as y}from"./Button-DJTTRrLP.js";import{n as b,t as x}from"./link-Du4AGLbo.js";import{a as S,c as C}from"./OperationFeedbackDialogs-BFlHnpVr.js";import{n as w,t as T}from"./IconButton-C_ZkoDI7.js";import{n as E,t as D}from"./LedgerInviteIdentityNotice-Dj4vBCwX.js";import{_ as ee,t as te,v as ne}from"./ledger-DQwEcTus.js";import{n as re,t as ie}from"./image-CT6eV4Ho.js";import{n as ae,t as oe}from"./PageShell-BfdzMXkz.js";import{n as se,t as ce}from"./ArrowBackRounded-CpnRt5D2.js";import{n as le,t as ue}from"./fullViewportPageBackgroundSx-BEsR-Htf.js";import{n as de,t as O}from"./HomeRounded-B5ynZG11.js";import{n as k,t as A}from"./LedgerInviteRoleRow-DbNyQ10F.js";async function j({fallbackErrorMessage:e,init:t,networkErrorMessage:n,onSuccess:r,url:i}){let a;try{a=await fetch(i,t)}catch{return{errorMessage:n,ok:!1}}return a.ok?(await r?.(),{ok:!0}):{errorMessage:M(await a.json().catch(()=>null))??e,ok:!1}}function M(e){if(!N(e)||!N(e.error))return null;let t=e.error.message;return typeof t==`string`&&t.trim()?t:null}function N(e){return typeof e==`object`&&!!e}var P=t((()=>{}));function F({exitHref:e=m.dashboard,preview:t,token:n}){let r=a(),[i,s]=(0,L.useState)(!1),[l,d]=(0,L.useState)(null),f=t.status===`already_member`,h=t.status===`invalid`||t.status===`revoked`||t.status===`accepted`,_=!h&&!f&&t.isPlaceholderBound?t.placeholderDisplayName:null,y=h?{alt:`邀请已失效插图`,src:`/assets/ledger-invite/invite-invalid.png`}:f?{alt:`已经加入账本插图`,src:`/assets/ledger-invite/invite-joined.png`}:{alt:`邀请加入账本插图`,src:`/assets/kura-invite/invite_illustration.png`};async function x(e){if(e.preventDefault(),!i){d(null),s(!0);try{let e=await j({fallbackErrorMessage:ne[ee.acceptFailed],init:{body:JSON.stringify({token:n}),headers:{"Content-Type":`application/json`},method:`POST`},networkErrorMessage:`加入账本失败，请检查网络后重试。`,onSuccess:()=>{r.push(m.dashboard),r.refresh()},url:`/api/ledger-invites/accept`});e.ok||d(e.errorMessage)}finally{s(!1)}}}return(0,I.jsxs)(I.Fragment,{children:[(0,I.jsx)(c,{"aria-hidden":`true`,sx:ue}),(0,I.jsx)(oe,{maxWidth:`xs`,sx:z,children:(0,I.jsxs)(o,{spacing:2.5,sx:{minHeight:`100dvh`,py:2},children:[(0,I.jsxs)(c,{"data-testid":`ledger-invite-page-illustration-slot`,sx:B,children:[(0,I.jsx)(re,{alt:y.alt,fill:!0,priority:!0,sizes:`(max-width: 600px) 100vw, 420px`,src:y.src,style:{objectFit:`cover`,objectPosition:`top right`}}),(0,I.jsx)(w,{"aria-label":`返回`,component:b,href:e,sx:V,children:(0,I.jsx)(ce,{})})]}),(0,I.jsxs)(o,{spacing:1,sx:{textAlign:`center`},children:[(0,I.jsx)(u,{component:`h1`,variant:`h4`,sx:{fontWeight:800},children:h?`邀请已失效`:f?`你已经加入该账本`:`邀请你加入账本`}),(0,I.jsx)(u,{color:`text.secondary`,children:h?`该邀请链接已经失效，请联系管理员重新发送邀请。`:f?`当前账号已经是该账本成员，无需再次加入。`:`${t.inviterName??`账本管理员`} 邀请你共同记录生活。`})]}),!h&&t.ledgerName?(0,I.jsx)(p,{sx:{p:2.25},children:(0,I.jsxs)(o,{spacing:1.75,children:[(0,I.jsxs)(o,{direction:`row`,spacing:1.2,sx:{alignItems:`center`},children:[(0,I.jsx)(c,{sx:H,children:(0,I.jsx)(O,{})}),(0,I.jsx)(u,{variant:`h5`,sx:{fontWeight:800},children:t.ledgerName})]}),(0,I.jsx)(A,{role:t.inviteRole??`member`}),(0,I.jsx)(u,{color:`text.secondary`,variant:`body2`,children:R[t.inviteRole??`member`]}),_?(0,I.jsx)(D,{name:_}):null]})}):null,(0,I.jsx)(o,{spacing:1.25,sx:{mt:`auto`},children:h?(0,I.jsx)(v,{component:b,href:e,variant:`contained`,children:`返回首页`}):f?(0,I.jsx)(v,{component:b,href:m.dashboard,variant:`contained`,children:`进入账本`}):(0,I.jsxs)(o,{direction:`row`,spacing:1.25,children:[(0,I.jsx)(v,{component:b,href:e,sx:{flex:1},variant:`outlined`,children:`取消`}),(0,I.jsx)(c,{component:`form`,onSubmit:x,sx:{flex:1},children:(0,I.jsx)(v,{disabled:i,fullWidth:!0,startIcon:i?(0,I.jsx)(g,{size:18}):void 0,type:`submit`,variant:`contained`,children:i?`加入中`:`加入账本`})})]})})]})}),(0,I.jsx)(S,{description:l??void 0,onClose:()=>d(null),open:l!==null,title:`加入账本失败`})]})}var I,L,R,z,B,V,H,U=t((()=>{I=r(),se(),de(),l(),y(),_(),T(),s(),d(),ie(),x(),i(),L=e(n()),f(),h(),P(),k(),E(),C(),te(),ae(),le(),R={admin:`加入后可管理账本、成员与基础设置，并共同记录数据。`,member:`加入后可共同查看和记录该账本的数据。`,viewer:`加入后可查看该账本的数据，但不能新增或修改记录。`},z={px:{xs:1.5,sm:2}},B={borderRadius:`0 0 28px 28px`,minHeight:280,mt:{xs:-2,sm:-3},mx:{xs:-1.5,sm:-2},overflow:`hidden`,position:`relative`},V={"@media (hover: hover)":{"&:hover":{bgcolor:`rgba(255, 255, 255, 0.95)`}},bgcolor:`rgba(255, 255, 255, 0.85)`,boxShadow:2,color:`text.primary`,left:12,position:`absolute`,top:12},H={alignItems:`center`,bgcolor:`var(--user-theme-icon-badge-bg)`,borderRadius:`50%`,color:`var(--user-theme-icon-badge-color)`,display:`inline-flex`,flexShrink:0,height:44,justifyContent:`center`,width:44,"& .MuiSvgIcon-root":{fontSize:24}},F.__docgenInfo={description:``,methods:[],displayName:`LedgerInviteTemplate`,props:{exitHref:{required:!1,tsType:{name:`string`},description:``,defaultValue:{value:`routePaths.dashboard`,computed:!0}},preview:{required:!0,tsType:{name:`LedgerInvitePreview`},description:``},token:{required:!0,tsType:{name:`string`},description:``}}}})),W,G,K,q,J,Y,X,Z,Q,$;t((()=>{U(),W={title:`Templates/Ledgers/LedgerInvite`,component:F,args:{preview:{inviteRole:`member`,inviterName:`淞文`,isPlaceholderBound:!1,ledgerName:`家庭账本`,placeholderDisplayName:null,status:`valid`},token:`storybook-invite-token`},parameters:{layout:`fullscreen`}},G={},K={args:{preview:{inviteRole:`admin`,inviterName:`淞文`,isPlaceholderBound:!1,ledgerName:`家庭账本`,placeholderDisplayName:null,status:`valid`}}},q={args:{preview:{inviteRole:`viewer`,inviterName:`淞文`,isPlaceholderBound:!1,ledgerName:`家庭账本`,placeholderDisplayName:null,status:`valid`}}},J={args:{preview:{inviteRole:`member`,inviterName:`淞文`,isPlaceholderBound:!1,ledgerName:`家庭账本`,placeholderDisplayName:null,status:`already_member`}}},Y={args:{preview:{inviteRole:null,inviterName:null,isPlaceholderBound:!1,ledgerName:null,placeholderDisplayName:null,status:`invalid`}}},X={args:{preview:{inviteRole:null,inviterName:null,isPlaceholderBound:!1,ledgerName:null,placeholderDisplayName:null,status:`revoked`}}},Z={name:`绑定待邀请成员（以某人身份加入）`,args:{preview:{inviteRole:`member`,inviterName:`淞文`,isPlaceholderBound:!0,ledgerName:`家庭账本`,placeholderDisplayName:`奶奶`,status:`valid`}}},Q={...Z,name:`绑定待邀请成员（移动端）`,parameters:{layout:`fullscreen`,viewport:{defaultViewport:`mobile2`}}},G.parameters={...G.parameters,docs:{...G.parameters?.docs,source:{originalSource:`{}`,...G.parameters?.docs?.source}}},K.parameters={...K.parameters,docs:{...K.parameters?.docs,source:{originalSource:`{
  args: {
    preview: {
      inviteRole: "admin",
      inviterName: "淞文",
      isPlaceholderBound: false,
      ledgerName: "家庭账本",
      placeholderDisplayName: null,
      status: "valid"
    }
  }
}`,...K.parameters?.docs?.source}}},q.parameters={...q.parameters,docs:{...q.parameters?.docs,source:{originalSource:`{
  args: {
    preview: {
      inviteRole: "viewer",
      inviterName: "淞文",
      isPlaceholderBound: false,
      ledgerName: "家庭账本",
      placeholderDisplayName: null,
      status: "valid"
    }
  }
}`,...q.parameters?.docs?.source}}},J.parameters={...J.parameters,docs:{...J.parameters?.docs,source:{originalSource:`{
  args: {
    preview: {
      inviteRole: "member",
      inviterName: "淞文",
      isPlaceholderBound: false,
      ledgerName: "家庭账本",
      placeholderDisplayName: null,
      status: "already_member"
    }
  }
}`,...J.parameters?.docs?.source}}},Y.parameters={...Y.parameters,docs:{...Y.parameters?.docs,source:{originalSource:`{
  args: {
    preview: {
      inviteRole: null,
      inviterName: null,
      isPlaceholderBound: false,
      ledgerName: null,
      placeholderDisplayName: null,
      status: "invalid"
    }
  }
}`,...Y.parameters?.docs?.source}}},X.parameters={...X.parameters,docs:{...X.parameters?.docs,source:{originalSource:`{
  args: {
    preview: {
      inviteRole: null,
      inviterName: null,
      isPlaceholderBound: false,
      ledgerName: null,
      placeholderDisplayName: null,
      status: "revoked"
    }
  }
}`,...X.parameters?.docs?.source}}},Z.parameters={...Z.parameters,docs:{...Z.parameters?.docs,source:{originalSource:`{
  name: "绑定待邀请成员（以某人身份加入）",
  args: {
    preview: {
      inviteRole: "member",
      inviterName: "淞文",
      isPlaceholderBound: true,
      ledgerName: "家庭账本",
      placeholderDisplayName: "奶奶",
      status: "valid"
    }
  }
}`,...Z.parameters?.docs?.source}}},Q.parameters={...Q.parameters,docs:{...Q.parameters?.docs,source:{originalSource:`{
  ...PlaceholderBound,
  name: "绑定待邀请成员（移动端）",
  parameters: {
    layout: "fullscreen",
    viewport: {
      defaultViewport: "mobile2"
    }
  }
}`,...Q.parameters?.docs?.source}}},$=[`Valid`,`Admin`,`Viewer`,`AlreadyMember`,`Invalid`,`Revoked`,`PlaceholderBound`,`PlaceholderBoundMobile`]}))();export{K as Admin,J as AlreadyMember,Y as Invalid,Z as PlaceholderBound,Q as PlaceholderBoundMobile,X as Revoked,G as Valid,q as Viewer,$ as __namedExportsOrder,W as default};