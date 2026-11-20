import{c as e,i as t}from"./preload-helper-D2yxXLVK.js";import{t as n}from"./react-DAMDAfNa.js";import{t as r}from"./jsx-runtime-Dwpk6tgA.js";import{n as i,t as a}from"./Typography-B_0Lz4TE.js";import{o,r as s}from"./paths-Cn5DhC5u.js";import{F as c,I as l,J as ee,R as u,ct as te,d as ne,m as d,ot as f,q as p,z as m}from"./iframe-BcOoBsDG.js";import{n as h,t as g}from"./Stack-CedAN9w3.js";import{n as _,t as v}from"./actionPendingMessages-B03PK8BF.js";import{n as y,t as re}from"./ActionButton-6CjOeZGB.js";import{n as ie,t as ae}from"./SoftCard-C6EGn3EH.js";import{n as oe,t as se}from"./ArrowBackRounded-B-EvwZhm.js";import{n as b,t as x}from"./link-Du4AGLbo.js";import{D as S,O as C,t as w}from"./ledger-vCOwyEdk.js";import{n as T,t as E}from"./LedgerInviteIdentityNotice-CnchLOR5.js";import{n as ce,t as le}from"./clientMutation-CgY5cANt.js";import{n as ue,t as D}from"./image-TZ9-P_r9.js";import{i as O,n as k,r as A,t as j}from"./fullViewportPageBackgroundSx-DRtfzO-J.js";import{n as M,t as N}from"./HomeRounded-C3zJPYoE.js";import{n as P,t as F}from"./LedgerInviteRoleRow-DcXaz71l.js";function I({exitHref:e=o.dashboard,preview:t,token:n}){let r=te(),[a,s]=(0,R.useState)(!1),[c,u]=(0,R.useState)(null),d=t.status===`already_member`,f=t.status===`invalid`||t.status===`revoked`||t.status===`accepted`,p=!f&&!d&&t.isPlaceholderBound?t.placeholderDisplayName:null,g=f?{alt:`邀请已失效插图`,src:`/assets/ledger-invite/invite-invalid.png`}:d?{alt:`已经加入账本插图`,src:`/assets/ledger-invite/invite-joined.png`}:{alt:`邀请加入账本插图`,src:`/assets/kura-invite/invite_illustration.png`};async function _(e){if(e.preventDefault(),!a){u(null),s(!0);try{let e=await le({fallbackErrorMessage:C[S.acceptFailed],init:{body:JSON.stringify({token:n}),headers:{"Content-Type":`application/json`},method:`POST`},networkErrorMessage:`加入账本失败，请检查网络后重试。`,onSuccess:()=>{r.push(o.dashboard),r.refresh()},url:`/api/ledger-invites/accept`});e.ok||u(e.errorMessage)}finally{s(!1)}}}return(0,L.jsxs)(L.Fragment,{children:[(0,L.jsx)(m,{"aria-hidden":`true`,sx:j}),(0,L.jsx)(A,{maxWidth:`xs`,sx:B,children:(0,L.jsxs)(h,{spacing:2.5,sx:{minHeight:`100dvh`,py:2},children:[(0,L.jsxs)(m,{"data-testid":`ledger-invite-page-illustration-slot`,sx:V,children:[(0,L.jsx)(ue,{alt:g.alt,fill:!0,priority:!0,sizes:`(max-width: 600px) 100vw, 420px`,src:g.src,style:{objectFit:`cover`,objectPosition:`top right`}}),(0,L.jsx)(ee,{"aria-label":`返回`,component:b,href:e,sx:H,children:(0,L.jsx)(se,{})})]}),(0,L.jsxs)(h,{spacing:1,sx:{textAlign:`center`},children:[(0,L.jsx)(i,{component:`h1`,variant:`h4`,sx:{fontWeight:800},children:f?`邀请已失效`:d?`你已经加入该账本`:`邀请你加入账本`}),(0,L.jsx)(i,{color:`textSecondary`,children:f?`该邀请链接已经失效，请联系管理员重新发送邀请。`:d?`当前账号已经是该账本成员，无需再次加入。`:`${t.inviterName??`账本管理员`} 邀请你共同记录生活。`})]}),!f&&t.ledgerName?(0,L.jsx)(ae,{sx:{p:2.25},children:(0,L.jsxs)(h,{spacing:1.75,children:[(0,L.jsxs)(h,{direction:`row`,spacing:1.2,sx:{alignItems:`center`},children:[(0,L.jsx)(m,{sx:U,children:(0,L.jsx)(N,{})}),(0,L.jsx)(i,{variant:`h5`,sx:{fontWeight:800},children:t.ledgerName})]}),(0,L.jsx)(F,{role:t.inviteRole??`member`}),(0,L.jsx)(i,{color:`textSecondary`,variant:`body2`,children:z[t.inviteRole??`member`]}),p?(0,L.jsx)(E,{name:p}):null]})}):null,(0,L.jsx)(h,{spacing:1.25,sx:{mt:`auto`},children:f?(0,L.jsx)(l,{component:b,href:e,variant:`contained`,children:`返回首页`}):d?(0,L.jsx)(l,{component:b,href:o.dashboard,variant:`contained`,children:`进入账本`}):(0,L.jsxs)(h,{direction:`row`,spacing:1.25,children:[(0,L.jsx)(l,{component:b,href:e,sx:{flex:1},variant:`outlined`,children:`取消`}),(0,L.jsx)(m,{component:`form`,onSubmit:_,sx:{flex:1},children:(0,L.jsx)(re,{fullWidth:!0,pending:a,pendingLabel:v.join,type:`submit`,variant:`contained`,children:`加入账本`})})]})})]})}),(0,L.jsx)(ne,{description:c??void 0,onClose:()=>u(null),open:c!==null,title:`加入账本失败`})]})}var L,R,z,B,V,H,U,de=t((()=>{L=r(),oe(),M(),u(),c(),y(),_(),p(),g(),a(),D(),x(),f(),R=e(n()),ie(),s(),ce(),P(),T(),d(),w(),O(),k(),z={admin:`加入后可管理账本、成员与基础设置，并共同记录数据。`,member:`加入后可共同查看和记录该账本的数据。`,viewer:`加入后可查看该账本的数据，但不能新增或修改记录。`},B={px:{xs:1.5,sm:2}},V={borderRadius:`0 0 28px 28px`,minHeight:280,mt:{xs:-2,sm:-3},mx:{xs:-1.5,sm:-2},overflow:`hidden`,position:`relative`},H={"@media (hover: hover)":{"&:hover":{bgcolor:`rgba(255, 255, 255, 0.95)`}},bgcolor:`rgba(255, 255, 255, 0.85)`,boxShadow:2,color:`text.primary`,left:12,position:`absolute`,top:12},U={alignItems:`center`,bgcolor:`var(--user-theme-icon-badge-bg)`,borderRadius:`50%`,color:`var(--user-theme-icon-badge-color)`,display:`inline-flex`,flexShrink:0,height:44,justifyContent:`center`,width:44,"& .MuiSvgIcon-root":{fontSize:24}},I.__docgenInfo={description:``,methods:[],displayName:`LedgerInviteTemplate`,props:{exitHref:{required:!1,tsType:{name:`string`},description:``,defaultValue:{value:`routePaths.dashboard`,computed:!0}},preview:{required:!0,tsType:{name:`LedgerInvitePreview`},description:``},token:{required:!0,tsType:{name:`string`},description:``}}}})),W,G,K,q,J,Y,X,Z,Q,$;t((()=>{de(),W={title:`Templates/Ledgers/LedgerInvite`,component:I,args:{preview:{inviteRole:`member`,inviterName:`淞文`,isPlaceholderBound:!1,ledgerName:`家庭账本`,placeholderDisplayName:null,status:`valid`},token:`storybook-invite-token`},parameters:{layout:`fullscreen`}},G={},K={args:{preview:{inviteRole:`admin`,inviterName:`淞文`,isPlaceholderBound:!1,ledgerName:`家庭账本`,placeholderDisplayName:null,status:`valid`}}},q={args:{preview:{inviteRole:`viewer`,inviterName:`淞文`,isPlaceholderBound:!1,ledgerName:`家庭账本`,placeholderDisplayName:null,status:`valid`}}},J={args:{preview:{inviteRole:`member`,inviterName:`淞文`,isPlaceholderBound:!1,ledgerName:`家庭账本`,placeholderDisplayName:null,status:`already_member`}}},Y={args:{preview:{inviteRole:null,inviterName:null,isPlaceholderBound:!1,ledgerName:null,placeholderDisplayName:null,status:`invalid`}}},X={args:{preview:{inviteRole:null,inviterName:null,isPlaceholderBound:!1,ledgerName:null,placeholderDisplayName:null,status:`revoked`}}},Z={name:`绑定待邀请成员（以某人身份加入）`,args:{preview:{inviteRole:`member`,inviterName:`淞文`,isPlaceholderBound:!0,ledgerName:`家庭账本`,placeholderDisplayName:`奶奶`,status:`valid`}}},Q={...Z,name:`绑定待邀请成员（移动端）`,parameters:{layout:`fullscreen`,viewport:{defaultViewport:`mobile2`}}},G.parameters={...G.parameters,docs:{...G.parameters?.docs,source:{originalSource:`{}`,...G.parameters?.docs?.source}}},K.parameters={...K.parameters,docs:{...K.parameters?.docs,source:{originalSource:`{
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