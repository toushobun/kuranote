import{c as e,i as t}from"./preload-helper-D2yxXLVK.js";import{t as n}from"./react-DAMDAfNa.js";import{t as r}from"./jsx-runtime-Dwpk6tgA.js";import{F as i,N as a}from"./iframe-CcLu1DPB.js";import{n as o,t as s}from"./Stack-DRbcmy6F.js";import{n as c,t as l}from"./Box-D-GhTrxh.js";import{n as u,t as d}from"./Typography-CwLqrFKa.js";import{a as f,n as p}from"./paths-B1Daueo6.js";import{n as m,t as h}from"./CircularProgress-DxhrkFLR.js";import{n as g,t as _}from"./Button-BvhFbL6z.js";import{n as v,t as y}from"./link-Du4AGLbo.js";import{n as b,t as x}from"./SoftCard-DGLdYMko.js";import{i as S,o as ee}from"./OperationFeedbackDialogs-CCbcfJ3v.js";import{n as te,t as ne}from"./IconButton-BvjujjMV.js";import{n as re,t as C}from"./image-D5bnnk0T.js";import{n as w,t as T}from"./LedgerInviteRoleRow-DuSipN2c.js";import{n as E,t as D}from"./ArrowBackRounded-CxlZpNyn.js";import{n as O,t as k}from"./PageShell-CurbQrD7.js";import{n as A,t as j}from"./fullViewportPageBackgroundSx-BEsR-Htf.js";import{n as M,t as ie}from"./HomeRounded-BXFj7a2q.js";async function N({fallbackErrorMessage:e,init:t,networkErrorMessage:n,onSuccess:r,url:i}){let a;try{a=await fetch(i,t)}catch{return{errorMessage:n,ok:!1}}return a.ok?(await r?.(),{ok:!0}):{errorMessage:P(await a.json().catch(()=>null))??e,ok:!1}}function P(e){if(!F(e)||!F(e.error))return null;let t=e.error.message;return typeof t==`string`&&t.trim()?t:null}function F(e){return typeof e==`object`&&!!e}var I=t((()=>{}));function L({exitHref:e=f.dashboard,preview:t,token:n}){let r=i(),[a,s]=(0,z.useState)(!1),[l,d]=(0,z.useState)(null),p=t.status===`already_member`,h=t.status===`invalid`||t.status===`revoked`||t.status===`accepted`,_=h?{alt:`邀请已失效插图`,src:`/assets/ledger-invite/invite-invalid.png`}:p?{alt:`已经加入账本插图`,src:`/assets/ledger-invite/invite-joined.png`}:{alt:`邀请加入账本插图`,src:`/assets/kura-invite/invite_illustration.png`};async function y(e){if(e.preventDefault(),!a){d(null),s(!0);try{let e=await N({fallbackErrorMessage:`加入账本失败，请稍后重试。`,init:{body:JSON.stringify({token:n}),headers:{"Content-Type":`application/json`},method:`POST`},networkErrorMessage:`加入账本失败，请检查网络后重试。`,onSuccess:()=>{r.push(f.dashboard),r.refresh()},url:`/api/ledger-invites/accept`});e.ok||d(e.errorMessage)}finally{s(!1)}}}return(0,R.jsxs)(R.Fragment,{children:[(0,R.jsx)(c,{"aria-hidden":`true`,sx:j}),(0,R.jsx)(k,{maxWidth:`xs`,sx:V,children:(0,R.jsxs)(o,{spacing:2.5,sx:{minHeight:`100dvh`,py:2},children:[(0,R.jsxs)(c,{"data-testid":`ledger-invite-page-illustration-slot`,sx:H,children:[(0,R.jsx)(re,{alt:_.alt,fill:!0,priority:!0,sizes:`(max-width: 600px) 100vw, 420px`,src:_.src,style:{objectFit:`cover`,objectPosition:`top right`}}),(0,R.jsx)(te,{"aria-label":`返回`,component:v,href:e,sx:U,children:(0,R.jsx)(D,{})})]}),(0,R.jsxs)(o,{spacing:1,sx:{textAlign:`center`},children:[(0,R.jsx)(u,{component:`h1`,variant:`h4`,sx:{fontWeight:800},children:h?`邀请已失效`:p?`你已经加入该账本`:`邀请你加入账本`}),(0,R.jsx)(u,{color:`text.secondary`,children:h?`该邀请链接已经失效，请联系管理员重新发送邀请。`:p?`当前账号已经是该账本成员，无需再次加入。`:`${t.inviterName??`账本管理员`} 邀请你共同记录生活。`})]}),!h&&t.ledgerName?(0,R.jsx)(x,{sx:{p:2.25},children:(0,R.jsxs)(o,{spacing:1.75,children:[(0,R.jsxs)(o,{direction:`row`,spacing:1.2,sx:{alignItems:`center`},children:[(0,R.jsx)(c,{sx:W,children:(0,R.jsx)(ie,{})}),(0,R.jsx)(u,{variant:`h5`,sx:{fontWeight:800},children:t.ledgerName})]}),(0,R.jsx)(T,{role:t.inviteRole??`member`}),(0,R.jsx)(u,{color:`text.secondary`,variant:`body2`,children:B[t.inviteRole??`member`]})]})}):null,(0,R.jsx)(o,{spacing:1.25,sx:{mt:`auto`},children:h?(0,R.jsx)(g,{component:v,href:e,variant:`contained`,children:`返回首页`}):p?(0,R.jsx)(g,{component:v,href:f.dashboard,variant:`contained`,children:`进入账本`}):(0,R.jsxs)(o,{direction:`row`,spacing:1.25,children:[(0,R.jsx)(g,{component:v,href:e,sx:{flex:1},variant:`outlined`,children:`取消`}),(0,R.jsx)(c,{component:`form`,onSubmit:y,sx:{flex:1},children:(0,R.jsx)(g,{disabled:a,fullWidth:!0,startIcon:a?(0,R.jsx)(m,{size:18}):void 0,type:`submit`,variant:`contained`,children:a?`加入中`:`加入账本`})})]})})]})}),(0,R.jsx)(S,{description:l??void 0,onClose:()=>d(null),open:l!==null,title:`加入账本失败`})]})}var R,z,B,V,H,U,W,G=t((()=>{R=r(),E(),M(),l(),_(),h(),ne(),s(),d(),C(),y(),a(),z=e(n()),b(),p(),I(),w(),ee(),O(),A(),B={admin:`加入后可管理账本、成员与基础设置，并共同记录数据。`,member:`加入后可共同查看和记录该账本的数据。`,viewer:`加入后可查看该账本的数据，但不能新增或修改记录。`},V={px:{xs:1.5,sm:2}},H={borderRadius:`0 0 28px 28px`,minHeight:280,mt:{xs:-2,sm:-3},mx:{xs:-1.5,sm:-2},overflow:`hidden`,position:`relative`},U={bgcolor:`rgba(255, 255, 255, 0.85)`,boxShadow:2,color:`text.primary`,left:12,position:`absolute`,top:12,"&:hover":{bgcolor:`rgba(255, 255, 255, 0.95)`}},W={alignItems:`center`,bgcolor:`var(--user-theme-icon-badge-bg)`,borderRadius:`50%`,color:`var(--user-theme-icon-badge-color)`,display:`inline-flex`,flexShrink:0,height:44,justifyContent:`center`,width:44,"& .MuiSvgIcon-root":{fontSize:24}},L.__docgenInfo={description:``,methods:[],displayName:`LedgerInviteTemplate`,props:{exitHref:{required:!1,tsType:{name:`string`},description:``,defaultValue:{value:`routePaths.dashboard`,computed:!0}},preview:{required:!0,tsType:{name:`LedgerInvitePreview`},description:``},token:{required:!0,tsType:{name:`string`},description:``}}}})),K,q,J,Y,X,Z,Q,$;t((()=>{G(),K={title:`Templates/Ledgers/LedgerInvite`,component:L,args:{preview:{inviteRole:`member`,inviterName:`淞文`,ledgerName:`家庭账本`,status:`valid`},token:`storybook-invite-token`},parameters:{layout:`fullscreen`}},q={},J={args:{preview:{inviteRole:`admin`,inviterName:`淞文`,ledgerName:`家庭账本`,status:`valid`}}},Y={args:{preview:{inviteRole:`viewer`,inviterName:`淞文`,ledgerName:`家庭账本`,status:`valid`}}},X={args:{preview:{inviteRole:`member`,inviterName:`淞文`,ledgerName:`家庭账本`,status:`already_member`}}},Z={args:{preview:{inviteRole:null,inviterName:null,ledgerName:null,status:`invalid`}}},Q={args:{preview:{inviteRole:null,inviterName:null,ledgerName:null,status:`revoked`}}},q.parameters={...q.parameters,docs:{...q.parameters?.docs,source:{originalSource:`{}`,...q.parameters?.docs?.source}}},J.parameters={...J.parameters,docs:{...J.parameters?.docs,source:{originalSource:`{
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