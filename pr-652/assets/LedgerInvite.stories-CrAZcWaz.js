import{c as e,i as t}from"./preload-helper-D2yxXLVK.js";import{t as n}from"./react-DAMDAfNa.js";import{t as r}from"./jsx-runtime-Dwpk6tgA.js";import{F as i,N as a}from"./iframe-K6KBdSDn.js";import{n as o,t as s}from"./Stack-DRbcmy6F.js";import{n as c,t as l}from"./Box-Brh2695t.js";import{n as u,t as d}from"./Typography-CwLqrFKa.js";import{n as f,t as ee}from"./SoftCard-DBKWBMxj.js";import{n as p,t as m}from"./CircularProgress-DxhrkFLR.js";import{n as h,t as g}from"./Button-DfoJRk0N.js";import{i as _,o as v}from"./OperationFeedbackDialogs-1xqZaFsT.js";import{n as y,t as b}from"./IconButton-Q9jYoDZ3.js";import{a as x,n as te}from"./paths-B1Daueo6.js";import{n as S,t as ne}from"./link-Du4AGLbo.js";import{n as C,t as w}from"./image-Zo17BNz-.js";import{n as T,t as E}from"./LedgerInviteRoleRow-BBxA7Km0.js";import{n as D,t as O}from"./ArrowBackRounded-CxlZpNyn.js";import{n as k,t as A}from"./PageShell-KJUyaL-s.js";import{n as j,t as re}from"./fullViewportPageBackgroundSx-BEsR-Htf.js";import{n as ie,t as M}from"./HomeRounded-BXFj7a2q.js";async function N({fallbackErrorMessage:e,init:t,networkErrorMessage:n,onSuccess:r,url:i}){let a;try{a=await fetch(i,t)}catch{return{errorMessage:n,ok:!1}}return a.ok?(await r?.(),{ok:!0}):{errorMessage:P(await a.json().catch(()=>null))??e,ok:!1}}function P(e){if(!F(e)||!F(e.error))return null;let t=e.error.message;return typeof t==`string`&&t.trim()?t:null}function F(e){return typeof e==`object`&&!!e}var I=t((()=>{}));function L({exitHref:e=x.dashboard,preview:t,token:n}){let r=i(),[a,s]=(0,z.useState)(!1),[l,d]=(0,z.useState)(null),f=t.status===`already_member`,m=t.status===`invalid`||t.status===`revoked`||t.status===`accepted`,g=m?{alt:`邀请已失效插图`,src:`/assets/ledger-invite/invite-invalid.png`}:f?{alt:`已经加入账本插图`,src:`/assets/ledger-invite/invite-joined.png`}:{alt:`邀请加入账本插图`,src:`/assets/kura-invite/invite_illustration.png`};async function v(e){if(e.preventDefault(),!a){d(null),s(!0);try{let e=await N({fallbackErrorMessage:`加入账本失败，请稍后重试。`,init:{body:JSON.stringify({token:n}),headers:{"Content-Type":`application/json`},method:`POST`},networkErrorMessage:`加入账本失败，请检查网络后重试。`,onSuccess:()=>{r.push(x.dashboard),r.refresh()},url:`/api/ledger-invites/accept`});e.ok||d(e.errorMessage)}finally{s(!1)}}}return(0,R.jsxs)(R.Fragment,{children:[(0,R.jsx)(c,{"aria-hidden":`true`,sx:re}),(0,R.jsx)(A,{maxWidth:`xs`,sx:V,children:(0,R.jsxs)(o,{spacing:2.5,sx:{minHeight:`100dvh`,py:2},children:[(0,R.jsxs)(c,{"data-testid":`ledger-invite-page-illustration-slot`,sx:H,children:[(0,R.jsx)(C,{alt:g.alt,fill:!0,priority:!0,sizes:`(max-width: 600px) 100vw, 420px`,src:g.src,style:{objectFit:`cover`,objectPosition:`top right`}}),(0,R.jsx)(y,{"aria-label":`返回`,component:S,href:e,sx:U,children:(0,R.jsx)(O,{})})]}),(0,R.jsxs)(o,{spacing:1,sx:{textAlign:`center`},children:[(0,R.jsx)(u,{component:`h1`,variant:`h4`,sx:{fontWeight:800},children:m?`邀请已失效`:f?`你已经加入该账本`:`邀请你加入账本`}),(0,R.jsx)(u,{color:`text.secondary`,children:m?`该邀请链接已经失效，请联系管理员重新发送邀请。`:f?`当前账号已经是该账本成员，无需再次加入。`:`${t.inviterName??`账本管理员`} 邀请你共同记录生活。`})]}),!m&&t.ledgerName?(0,R.jsx)(ee,{sx:{p:2.25},children:(0,R.jsxs)(o,{spacing:1.75,children:[(0,R.jsxs)(o,{direction:`row`,spacing:1.2,sx:{alignItems:`center`},children:[(0,R.jsx)(c,{sx:W,children:(0,R.jsx)(M,{})}),(0,R.jsx)(u,{variant:`h5`,sx:{fontWeight:800},children:t.ledgerName})]}),(0,R.jsx)(E,{role:t.inviteRole??`member`}),(0,R.jsx)(u,{color:`text.secondary`,variant:`body2`,children:B[t.inviteRole??`member`]})]})}):null,(0,R.jsx)(o,{spacing:1.25,sx:{mt:`auto`},children:m?(0,R.jsx)(h,{component:S,href:e,variant:`contained`,children:`返回首页`}):f?(0,R.jsx)(h,{component:S,href:x.dashboard,variant:`contained`,children:`进入账本`}):(0,R.jsxs)(o,{direction:`row`,spacing:1.25,children:[(0,R.jsx)(h,{component:S,href:e,sx:{flex:1},variant:`outlined`,children:`取消`}),(0,R.jsx)(c,{component:`form`,onSubmit:v,sx:{flex:1},children:(0,R.jsx)(h,{disabled:a,fullWidth:!0,startIcon:a?(0,R.jsx)(p,{size:18}):void 0,type:`submit`,variant:`contained`,children:a?`加入中`:`加入账本`})})]})})]})}),(0,R.jsx)(_,{description:l??void 0,onClose:()=>d(null),open:l!==null,title:`加入账本失败`})]})}var R,z,B,V,H,U,W,G=t((()=>{R=r(),D(),ie(),l(),g(),m(),b(),s(),d(),w(),ne(),a(),z=e(n()),f(),te(),I(),T(),v(),k(),j(),B={admin:`加入后可管理账本、成员与基础设置，并共同记录数据。`,member:`加入后可共同查看和记录该账本的数据。`,viewer:`加入后可查看该账本的数据，但不能新增或修改记录。`},V={px:{xs:1.5,sm:2}},H={borderRadius:`0 0 28px 28px`,minHeight:280,mt:{xs:-2,sm:-3},mx:{xs:-1.5,sm:-2},overflow:`hidden`,position:`relative`},U={bgcolor:`rgba(255, 255, 255, 0.85)`,boxShadow:2,color:`text.primary`,left:12,position:`absolute`,top:12,"&:hover":{bgcolor:`rgba(255, 255, 255, 0.95)`}},W={alignItems:`center`,bgcolor:`var(--user-theme-icon-badge-bg)`,borderRadius:`50%`,color:`var(--user-theme-icon-badge-color)`,display:`inline-flex`,flexShrink:0,height:44,justifyContent:`center`,width:44,"& .MuiSvgIcon-root":{fontSize:24}},L.__docgenInfo={description:``,methods:[],displayName:`LedgerInviteTemplate`,props:{exitHref:{required:!1,tsType:{name:`string`},description:``,defaultValue:{value:`routePaths.dashboard`,computed:!0}},preview:{required:!0,tsType:{name:`LedgerInvitePreview`},description:``},token:{required:!0,tsType:{name:`string`},description:``}}}})),K,q,J,Y,X,Z,Q,$;t((()=>{G(),K={title:`Templates/Ledgers/LedgerInvite`,component:L,args:{preview:{inviteRole:`member`,inviterName:`淞文`,ledgerName:`家庭账本`,status:`valid`},token:`storybook-invite-token`},parameters:{layout:`fullscreen`}},q={},J={args:{preview:{inviteRole:`admin`,inviterName:`淞文`,ledgerName:`家庭账本`,status:`valid`}}},Y={args:{preview:{inviteRole:`viewer`,inviterName:`淞文`,ledgerName:`家庭账本`,status:`valid`}}},X={args:{preview:{inviteRole:`member`,inviterName:`淞文`,ledgerName:`家庭账本`,status:`already_member`}}},Z={args:{preview:{inviteRole:null,inviterName:null,ledgerName:null,status:`invalid`}}},Q={args:{preview:{inviteRole:null,inviterName:null,ledgerName:null,status:`revoked`}}},q.parameters={...q.parameters,docs:{...q.parameters?.docs,source:{originalSource:`{}`,...q.parameters?.docs?.source}}},J.parameters={...J.parameters,docs:{...J.parameters?.docs,source:{originalSource:`{
  args: {
    preview: {
      inviteRole: "admin",
      inviterName: "淞文",
      ledgerName: "家庭账本",
      status: "valid"
    }
  }
}`,...J.parameters?.docs?.source}}},Y.parameters={...Y.parameters,docs:{...Y.parameters?.docs,source:{originalSource:`{
  args: {
    preview: {
      inviteRole: "viewer",
      inviterName: "淞文",
      ledgerName: "家庭账本",
      status: "valid"
    }
  }
}`,...Y.parameters?.docs?.source}}},X.parameters={...X.parameters,docs:{...X.parameters?.docs,source:{originalSource:`{
  args: {
    preview: {
      inviteRole: "member",
      inviterName: "淞文",
      ledgerName: "家庭账本",
      status: "already_member"
    }
  }
}`,...X.parameters?.docs?.source}}},Z.parameters={...Z.parameters,docs:{...Z.parameters?.docs,source:{originalSource:`{
  args: {
    preview: {
      inviteRole: null,
      inviterName: null,
      ledgerName: null,
      status: "invalid"
    }
  }
}`,...Z.parameters?.docs?.source}}},Q.parameters={...Q.parameters,docs:{...Q.parameters?.docs,source:{originalSource:`{
  args: {
    preview: {
      inviteRole: null,
      inviterName: null,
      ledgerName: null,
      status: "revoked"
    }
  }
}`,...Q.parameters?.docs?.source}}},$=[`Valid`,`Admin`,`Viewer`,`AlreadyMember`,`Invalid`,`Revoked`]}))();export{J as Admin,X as AlreadyMember,Z as Invalid,Q as Revoked,q as Valid,Y as Viewer,$ as __namedExportsOrder,K as default};