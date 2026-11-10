import{c as e,i as t}from"./preload-helper-D2yxXLVK.js";import{t as n}from"./react-DAMDAfNa.js";import{t as r}from"./jsx-runtime-Dwpk6tgA.js";import{n as i,t as a}from"./CircularProgress-BoLoAo4n.js";import{n as o,t as s}from"./Typography-C_MqbCH8.js";import{c,i as l}from"./paths-D3rhNSa3.js";import{F as u,I as d,J as f,R as p,ct as ee,d as te,m,ot as h,q as g,z as _}from"./iframe-Duy35H1z.js";import{n as v,t as y}from"./Stack-BknIK93v.js";import{n as b,t as x}from"./SoftCard-BMcOy1r3.js";import{n as S,t as C}from"./link-Du4AGLbo.js";import{D as w,O as T,t as E}from"./ledger-vCOwyEdk.js";import{n as D,t as O}from"./LedgerInviteIdentityNotice-BfBv4ZFQ.js";import{n as k,t as ne}from"./image-bhjAT2_I.js";import{n as re,t as ie}from"./PageShell-Cvz3X4f2.js";import{n as ae,t as oe}from"./ArrowBackRounded-Br0P8PbS.js";import{n as se,t as ce}from"./fullViewportPageBackgroundSx-BEsR-Htf.js";import{n as le,t as ue}from"./HomeRounded-D87p4boz.js";import{n as A,t as j}from"./LedgerInviteRoleRow-DhR6K6Wc.js";async function M({fallbackErrorMessage:e,init:t,networkErrorMessage:n,onSuccess:r,url:i}){let a;try{a=await fetch(i,t)}catch{return{errorMessage:n,ok:!1}}return a.ok?(await r?.(),{ok:!0}):{errorMessage:N(await a.json().catch(()=>null))??e,ok:!1}}function N(e){if(!P(e)||!P(e.error))return null;let t=e.error.message;return typeof t==`string`&&t.trim()?t:null}function P(e){return typeof e==`object`&&!!e}var F=t((()=>{}));function I({exitHref:e=c.dashboard,preview:t,token:n}){let r=ee(),[a,s]=(0,R.useState)(!1),[l,u]=(0,R.useState)(null),p=t.status===`already_member`,m=t.status===`invalid`||t.status===`revoked`||t.status===`accepted`,h=!m&&!p&&t.isPlaceholderBound?t.placeholderDisplayName:null,g=m?{alt:`邀请已失效插图`,src:`/assets/ledger-invite/invite-invalid.png`}:p?{alt:`已经加入账本插图`,src:`/assets/ledger-invite/invite-joined.png`}:{alt:`邀请加入账本插图`,src:`/assets/kura-invite/invite_illustration.png`};async function y(e){if(e.preventDefault(),!a){u(null),s(!0);try{let e=await M({fallbackErrorMessage:T[w.acceptFailed],init:{body:JSON.stringify({token:n}),headers:{"Content-Type":`application/json`},method:`POST`},networkErrorMessage:`加入账本失败，请检查网络后重试。`,onSuccess:()=>{r.push(c.dashboard),r.refresh()},url:`/api/ledger-invites/accept`});e.ok||u(e.errorMessage)}finally{s(!1)}}}return(0,L.jsxs)(L.Fragment,{children:[(0,L.jsx)(_,{"aria-hidden":`true`,sx:ce}),(0,L.jsx)(ie,{maxWidth:`xs`,sx:B,children:(0,L.jsxs)(v,{spacing:2.5,sx:{minHeight:`100dvh`,py:2},children:[(0,L.jsxs)(_,{"data-testid":`ledger-invite-page-illustration-slot`,sx:V,children:[(0,L.jsx)(k,{alt:g.alt,fill:!0,priority:!0,sizes:`(max-width: 600px) 100vw, 420px`,src:g.src,style:{objectFit:`cover`,objectPosition:`top right`}}),(0,L.jsx)(f,{"aria-label":`返回`,component:S,href:e,sx:H,children:(0,L.jsx)(oe,{})})]}),(0,L.jsxs)(v,{spacing:1,sx:{textAlign:`center`},children:[(0,L.jsx)(o,{component:`h1`,variant:`h4`,sx:{fontWeight:800},children:m?`邀请已失效`:p?`你已经加入该账本`:`邀请你加入账本`}),(0,L.jsx)(o,{color:`textSecondary`,children:m?`该邀请链接已经失效，请联系管理员重新发送邀请。`:p?`当前账号已经是该账本成员，无需再次加入。`:`${t.inviterName??`账本管理员`} 邀请你共同记录生活。`})]}),!m&&t.ledgerName?(0,L.jsx)(x,{sx:{p:2.25},children:(0,L.jsxs)(v,{spacing:1.75,children:[(0,L.jsxs)(v,{direction:`row`,spacing:1.2,sx:{alignItems:`center`},children:[(0,L.jsx)(_,{sx:U,children:(0,L.jsx)(ue,{})}),(0,L.jsx)(o,{variant:`h5`,sx:{fontWeight:800},children:t.ledgerName})]}),(0,L.jsx)(j,{role:t.inviteRole??`member`}),(0,L.jsx)(o,{color:`textSecondary`,variant:`body2`,children:z[t.inviteRole??`member`]}),h?(0,L.jsx)(O,{name:h}):null]})}):null,(0,L.jsx)(v,{spacing:1.25,sx:{mt:`auto`},children:m?(0,L.jsx)(d,{component:S,href:e,variant:`contained`,children:`返回首页`}):p?(0,L.jsx)(d,{component:S,href:c.dashboard,variant:`contained`,children:`进入账本`}):(0,L.jsxs)(v,{direction:`row`,spacing:1.25,children:[(0,L.jsx)(d,{component:S,href:e,sx:{flex:1},variant:`outlined`,children:`取消`}),(0,L.jsx)(_,{component:`form`,onSubmit:y,sx:{flex:1},children:(0,L.jsx)(d,{disabled:a,fullWidth:!0,startIcon:a?(0,L.jsx)(i,{size:18}):void 0,type:`submit`,variant:`contained`,children:a?`加入中`:`加入账本`})})]})})]})}),(0,L.jsx)(te,{description:l??void 0,onClose:()=>u(null),open:l!==null,title:`加入账本失败`})]})}var L,R,z,B,V,H,U,de=t((()=>{L=r(),ae(),le(),p(),u(),a(),g(),y(),s(),ne(),C(),h(),R=e(n()),b(),l(),F(),A(),D(),m(),E(),re(),se(),z={admin:`加入后可管理账本、成员与基础设置，并共同记录数据。`,member:`加入后可共同查看和记录该账本的数据。`,viewer:`加入后可查看该账本的数据，但不能新增或修改记录。`},B={px:{xs:1.5,sm:2}},V={borderRadius:`0 0 28px 28px`,minHeight:280,mt:{xs:-2,sm:-3},mx:{xs:-1.5,sm:-2},overflow:`hidden`,position:`relative`},H={"@media (hover: hover)":{"&:hover":{bgcolor:`rgba(255, 255, 255, 0.95)`}},bgcolor:`rgba(255, 255, 255, 0.85)`,boxShadow:2,color:`text.primary`,left:12,position:`absolute`,top:12},U={alignItems:`center`,bgcolor:`var(--user-theme-icon-badge-bg)`,borderRadius:`50%`,color:`var(--user-theme-icon-badge-color)`,display:`inline-flex`,flexShrink:0,height:44,justifyContent:`center`,width:44,"& .MuiSvgIcon-root":{fontSize:24}},I.__docgenInfo={description:``,methods:[],displayName:`LedgerInviteTemplate`,props:{exitHref:{required:!1,tsType:{name:`string`},description:``,defaultValue:{value:`routePaths.dashboard`,computed:!0}},preview:{required:!0,tsType:{name:`LedgerInvitePreview`},description:``},token:{required:!0,tsType:{name:`string`},description:``}}}})),W,G,K,q,J,Y,X,Z,Q,$;t((()=>{de(),W={title:`Templates/Ledgers/LedgerInvite`,component:I,args:{preview:{inviteRole:`member`,inviterName:`淞文`,isPlaceholderBound:!1,ledgerName:`家庭账本`,placeholderDisplayName:null,status:`valid`},token:`storybook-invite-token`},parameters:{layout:`fullscreen`}},G={},K={args:{preview:{inviteRole:`admin`,inviterName:`淞文`,isPlaceholderBound:!1,ledgerName:`家庭账本`,placeholderDisplayName:null,status:`valid`}}},q={args:{preview:{inviteRole:`viewer`,inviterName:`淞文`,isPlaceholderBound:!1,ledgerName:`家庭账本`,placeholderDisplayName:null,status:`valid`}}},J={args:{preview:{inviteRole:`member`,inviterName:`淞文`,isPlaceholderBound:!1,ledgerName:`家庭账本`,placeholderDisplayName:null,status:`already_member`}}},Y={args:{preview:{inviteRole:null,inviterName:null,isPlaceholderBound:!1,ledgerName:null,placeholderDisplayName:null,status:`invalid`}}},X={args:{preview:{inviteRole:null,inviterName:null,isPlaceholderBound:!1,ledgerName:null,placeholderDisplayName:null,status:`revoked`}}},Z={name:`绑定待邀请成员（以某人身份加入）`,args:{preview:{inviteRole:`member`,inviterName:`淞文`,isPlaceholderBound:!0,ledgerName:`家庭账本`,placeholderDisplayName:`奶奶`,status:`valid`}}},Q={...Z,name:`绑定待邀请成员（移动端）`,parameters:{layout:`fullscreen`,viewport:{defaultViewport:`mobile2`}}},G.parameters={...G.parameters,docs:{...G.parameters?.docs,source:{originalSource:`{}`,...G.parameters?.docs?.source}}},K.parameters={...K.parameters,docs:{...K.parameters?.docs,source:{originalSource:`{
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