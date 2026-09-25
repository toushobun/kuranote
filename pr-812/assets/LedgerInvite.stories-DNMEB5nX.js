import{c as e,i as t}from"./preload-helper-D2yxXLVK.js";import{t as n}from"./react-DAMDAfNa.js";import{t as r}from"./jsx-runtime-Dwpk6tgA.js";import{F as i,N as a}from"./iframe-D1t9zIGp.js";import{n as o,t as s}from"./Stack-DRbcmy6F.js";import{n as c,t as l}from"./Box-DiKbu346.js";import{n as u,t as d}from"./Typography-CwLqrFKa.js";import{a as f,n as p}from"./paths-BabFpEj2.js";import{n as m,t as h}from"./CircularProgress-DxhrkFLR.js";import{n as g,t as _}from"./Button-CmZIvK63.js";import{n as v,t as y}from"./link-Du4AGLbo.js";import{n as b,t as ee}from"./SoftCard-DxfALzNX.js";import{i as te,o as ne}from"./OperationFeedbackDialogs-CCMTkhLy.js";import{n as re,t as ie}from"./IconButton-DgEIThjY.js";import{n as ae,t as oe}from"./LedgerInviteIdentityNotice-CZ--6bqN.js";import{n as se,t as x}from"./image-CT61w65I.js";import{n as S,t as C}from"./LedgerInviteRoleRow-BPABdK-n.js";import{n as w,t as T}from"./ArrowBackRounded-CxlZpNyn.js";import{n as E,t as D}from"./PageShell-DXT4JD4E.js";import{n as O,t as k}from"./fullViewportPageBackgroundSx-BEsR-Htf.js";import{n as A,t as j}from"./HomeRounded-BXFj7a2q.js";async function ce({fallbackErrorMessage:e,init:t,networkErrorMessage:n,onSuccess:r,url:i}){let a;try{a=await fetch(i,t)}catch{return{errorMessage:n,ok:!1}}return a.ok?(await r?.(),{ok:!0}):{errorMessage:M(await a.json().catch(()=>null))??e,ok:!1}}function M(e){if(!N(e)||!N(e.error))return null;let t=e.error.message;return typeof t==`string`&&t.trim()?t:null}function N(e){return typeof e==`object`&&!!e}var P=t((()=>{}));function F({exitHref:e=f.dashboard,preview:t,token:n}){let r=i(),[a,s]=(0,L.useState)(!1),[l,d]=(0,L.useState)(null),p=t.status===`already_member`,h=t.status===`invalid`||t.status===`revoked`||t.status===`accepted`,_=!h&&!p&&t.isPlaceholderBound?t.placeholderDisplayName:null,y=h?{alt:`邀请已失效插图`,src:`/assets/ledger-invite/invite-invalid.png`}:p?{alt:`已经加入账本插图`,src:`/assets/ledger-invite/invite-joined.png`}:{alt:`邀请加入账本插图`,src:`/assets/kura-invite/invite_illustration.png`};async function b(e){if(e.preventDefault(),!a){d(null),s(!0);try{let e=await ce({fallbackErrorMessage:`加入账本失败，请稍后重试。`,init:{body:JSON.stringify({token:n}),headers:{"Content-Type":`application/json`},method:`POST`},networkErrorMessage:`加入账本失败，请检查网络后重试。`,onSuccess:()=>{r.push(f.dashboard),r.refresh()},url:`/api/ledger-invites/accept`});e.ok||d(e.errorMessage)}finally{s(!1)}}}return(0,I.jsxs)(I.Fragment,{children:[(0,I.jsx)(c,{"aria-hidden":`true`,sx:k}),(0,I.jsx)(D,{maxWidth:`xs`,sx:z,children:(0,I.jsxs)(o,{spacing:2.5,sx:{minHeight:`100dvh`,py:2},children:[(0,I.jsxs)(c,{"data-testid":`ledger-invite-page-illustration-slot`,sx:B,children:[(0,I.jsx)(se,{alt:y.alt,fill:!0,priority:!0,sizes:`(max-width: 600px) 100vw, 420px`,src:y.src,style:{objectFit:`cover`,objectPosition:`top right`}}),(0,I.jsx)(re,{"aria-label":`返回`,component:v,href:e,sx:V,children:(0,I.jsx)(T,{})})]}),(0,I.jsxs)(o,{spacing:1,sx:{textAlign:`center`},children:[(0,I.jsx)(u,{component:`h1`,variant:`h4`,sx:{fontWeight:800},children:h?`邀请已失效`:p?`你已经加入该账本`:`邀请你加入账本`}),(0,I.jsx)(u,{color:`text.secondary`,children:h?`该邀请链接已经失效，请联系管理员重新发送邀请。`:p?`当前账号已经是该账本成员，无需再次加入。`:`${t.inviterName??`账本管理员`} 邀请你共同记录生活。`})]}),!h&&t.ledgerName?(0,I.jsx)(ee,{sx:{p:2.25},children:(0,I.jsxs)(o,{spacing:1.75,children:[(0,I.jsxs)(o,{direction:`row`,spacing:1.2,sx:{alignItems:`center`},children:[(0,I.jsx)(c,{sx:H,children:(0,I.jsx)(j,{})}),(0,I.jsx)(u,{variant:`h5`,sx:{fontWeight:800},children:t.ledgerName})]}),(0,I.jsx)(C,{role:t.inviteRole??`member`}),(0,I.jsx)(u,{color:`text.secondary`,variant:`body2`,children:R[t.inviteRole??`member`]}),_?(0,I.jsx)(oe,{name:_}):null]})}):null,(0,I.jsx)(o,{spacing:1.25,sx:{mt:`auto`},children:h?(0,I.jsx)(g,{component:v,href:e,variant:`contained`,children:`返回首页`}):p?(0,I.jsx)(g,{component:v,href:f.dashboard,variant:`contained`,children:`进入账本`}):(0,I.jsxs)(o,{direction:`row`,spacing:1.25,children:[(0,I.jsx)(g,{component:v,href:e,sx:{flex:1},variant:`outlined`,children:`取消`}),(0,I.jsx)(c,{component:`form`,onSubmit:b,sx:{flex:1},children:(0,I.jsx)(g,{disabled:a,fullWidth:!0,startIcon:a?(0,I.jsx)(m,{size:18}):void 0,type:`submit`,variant:`contained`,children:a?`加入中`:`加入账本`})})]})})]})}),(0,I.jsx)(te,{description:l??void 0,onClose:()=>d(null),open:l!==null,title:`加入账本失败`})]})}var I,L,R,z,B,V,H,U=t((()=>{I=r(),w(),A(),l(),_(),h(),ie(),s(),d(),x(),y(),a(),L=e(n()),b(),p(),P(),S(),ae(),ne(),E(),O(),R={admin:`加入后可管理账本、成员与基础设置，并共同记录数据。`,member:`加入后可共同查看和记录该账本的数据。`,viewer:`加入后可查看该账本的数据，但不能新增或修改记录。`},z={px:{xs:1.5,sm:2}},B={borderRadius:`0 0 28px 28px`,minHeight:280,mt:{xs:-2,sm:-3},mx:{xs:-1.5,sm:-2},overflow:`hidden`,position:`relative`},V={"@media (hover: hover)":{"&:hover":{bgcolor:`rgba(255, 255, 255, 0.95)`}},bgcolor:`rgba(255, 255, 255, 0.85)`,boxShadow:2,color:`text.primary`,left:12,position:`absolute`,top:12},H={alignItems:`center`,bgcolor:`var(--user-theme-icon-badge-bg)`,borderRadius:`50%`,color:`var(--user-theme-icon-badge-color)`,display:`inline-flex`,flexShrink:0,height:44,justifyContent:`center`,width:44,"& .MuiSvgIcon-root":{fontSize:24}},F.__docgenInfo={description:``,methods:[],displayName:`LedgerInviteTemplate`,props:{exitHref:{required:!1,tsType:{name:`string`},description:``,defaultValue:{value:`routePaths.dashboard`,computed:!0}},preview:{required:!0,tsType:{name:`LedgerInvitePreview`},description:``},token:{required:!0,tsType:{name:`string`},description:``}}}})),W,G,K,q,J,Y,X,Z,Q,$;t((()=>{U(),W={title:`Templates/Ledgers/LedgerInvite`,component:F,args:{preview:{inviteRole:`member`,inviterName:`淞文`,isPlaceholderBound:!1,ledgerName:`家庭账本`,placeholderDisplayName:null,status:`valid`},token:`storybook-invite-token`},parameters:{layout:`fullscreen`}},G={},K={args:{preview:{inviteRole:`admin`,inviterName:`淞文`,isPlaceholderBound:!1,ledgerName:`家庭账本`,placeholderDisplayName:null,status:`valid`}}},q={args:{preview:{inviteRole:`viewer`,inviterName:`淞文`,isPlaceholderBound:!1,ledgerName:`家庭账本`,placeholderDisplayName:null,status:`valid`}}},J={args:{preview:{inviteRole:`member`,inviterName:`淞文`,isPlaceholderBound:!1,ledgerName:`家庭账本`,placeholderDisplayName:null,status:`already_member`}}},Y={args:{preview:{inviteRole:null,inviterName:null,isPlaceholderBound:!1,ledgerName:null,placeholderDisplayName:null,status:`invalid`}}},X={args:{preview:{inviteRole:null,inviterName:null,isPlaceholderBound:!1,ledgerName:null,placeholderDisplayName:null,status:`revoked`}}},Z={name:`绑定待邀请成员（以某人身份加入）`,args:{preview:{inviteRole:`member`,inviterName:`淞文`,isPlaceholderBound:!0,ledgerName:`家庭账本`,placeholderDisplayName:`奶奶`,status:`valid`}}},Q={...Z,name:`绑定待邀请成员（移动端）`,parameters:{layout:`fullscreen`,viewport:{defaultViewport:`mobile2`}}},G.parameters={...G.parameters,docs:{...G.parameters?.docs,source:{originalSource:`{}`,...G.parameters?.docs?.source}}},K.parameters={...K.parameters,docs:{...K.parameters?.docs,source:{originalSource:`{
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