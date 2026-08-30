import{c as e,i as t}from"./preload-helper-D2yxXLVK.js";import{t as n}from"./react-DAMDAfNa.js";import{t as r}from"./jsx-runtime-Dwpk6tgA.js";import{F as ee,N as i}from"./iframe-K6KBdSDn.js";import{n as a,t as o}from"./Chip-qfZoV-2e.js";import{n as s,t as c}from"./Stack-DRbcmy6F.js";import{n as te,t as l}from"./Box-Brh2695t.js";import{n as u,t as d}from"./Typography-CwLqrFKa.js";import{a as ne,o as re}from"./accounts-DpbEXm7k.js";import{n as ie,t as f}from"./Button-DfoJRk0N.js";import{a as ae,i as oe,o as p}from"./OperationFeedbackDialogs-1xqZaFsT.js";import{n as se,t as m}from"./IconButton-Q9jYoDZ3.js";import{a as ce,n as h}from"./paths-B1Daueo6.js";import{n as g,t as _}from"./UserThemeProvider-BwD6iBiD.js";import{n as le,t as v}from"./link-Du4AGLbo.js";import{n as y,t as b}from"./AccountForm-BBf1vMJ7.js";import{n as x,r as S,t as C}from"./AccountFormDialogShell-B31JIwlE.js";import{n as w,t as ue}from"./AccountList-C2VUIxiO.js";import{n as T,t as de}from"./AccountSummaryCard-CSKJjMq7.js";import{n as E,t as fe}from"./AddRounded-ij6gkWwb.js";import{n as D,t as O}from"./bottomNavigationLayout-RS2iCWfT.js";import{n as k,t as pe}from"./TransactionAmountKeypadLauncher-BFnHEyp2.js";import{n as A,t as me}from"./ArrowBackRounded-CxlZpNyn.js";import{n as j,t as he}from"./PageShell-KJUyaL-s.js";import{n as M,t as ge}from"./fullViewportPageBackgroundSx-BEsR-Htf.js";function N({createAccountAction:e,defaultCurrency:t,holderOptions:n,onClose:r,open:ee}){return(0,P.jsx)(x,{illustrationSlot:(0,P.jsx)(C,{}),onClose:r,open:ee,children:(0,P.jsx)(b,{createAccountAction:e,defaultCurrency:t,holderOptions:n,onCancel:r})})}var P,F=t((()=>{P=r(),y(),S(),N.__docgenInfo={description:``,methods:[],displayName:`AccountCreateDialog`,props:{createAccountAction:{required:!0,tsType:{name:`ServerAction`},description:``},defaultCurrency:{required:!0,tsType:{name:`string`},description:``},holderOptions:{required:!0,tsType:{name:`Array`,elements:[{name:`AccountHolderOption`}],raw:`AccountHolderOption[]`},description:``},onClose:{required:!0,tsType:{name:`signature`,type:`function`,raw:`() => void`,signature:{arguments:[],return:{name:`void`}}},description:``},open:{required:!0,tsType:{name:`boolean`},description:``}}}}));function I({accounts:e,archiveAccountAction:t,baseCurrency:n,canManageAccounts:r=!0,canWriteTransactions:i=!0,createAccountAction:a,initialErrorKey:o=null,initialErrorMessage:c=null,holderOptions:l,saveResult:d=null,updateAccountAction:re}){let[f,p]=(0,z.useState)(`all`),[m,h]=(0,z.useState)(!1),[g,_]=(0,z.useState)([]),v=(0,z.useRef)(0),y=(0,z.useRef)(new Set),[b,x]=(0,z.useState)(d),[S,C]=(0,z.useState)(d!==null),[w,T]=(0,z.useState)(d),[E,D]=(0,z.useActionState)(a,B),[O,k]=(0,z.useActionState)(re,B),[A,j]=(0,z.useActionState)(t,B),M=ee();(0,z.useEffect)(()=>{let e=[{error:c??void 0,errorKey:o??void 0},E,O,A];for(let t of e){if(!t.error||!t.errorKey||y.current.has(t.errorKey))continue;y.current.add(t.errorKey),v.current+=1;let e=`${t.errorKey}-${v.current}`;_(n=>[...n,{id:e,message:t.error}])}},[A,E,o,c,O]),d!==w&&(T(d),d!==null&&(x(d),C(!0),h(!1)));let P=(0,z.useMemo)(()=>f===`all`?e:e.filter(e=>e.type===f),[e,f]),F=f!==`all`&&P.length===0,I=ve[b??`updated`];function ye(e){_(t=>t.filter(t=>t.id!==e))}function K(){C(!1);let e=new URL(window.location.href);e.searchParams.delete(`result`),M.replace(`${e.pathname}${e.search}${e.hash}`,{scroll:!1})}return(0,R.jsxs)(R.Fragment,{children:[(0,R.jsx)(te,{"aria-hidden":`true`,"data-testid":`accounts-page-background`,sx:ge}),(0,R.jsxs)(he,{maxWidth:`xs`,sx:H,children:[(0,R.jsxs)(s,{spacing:1.35,children:[(0,R.jsxs)(s,{spacing:.4,children:[(0,R.jsxs)(s,{direction:`row`,spacing:.75,sx:{alignItems:`center`},children:[(0,R.jsx)(se,{"aria-label":`返回`,component:le,href:ce.settings,sx:V,children:(0,R.jsx)(me,{})}),(0,R.jsx)(u,{component:`h1`,sx:{flex:1,fontSize:{xs:24,sm:26},fontWeight:900},children:`账户管理`}),r?(0,R.jsx)(ie,{onClick:()=>h(!0),startIcon:(0,R.jsx)(fe,{}),sx:W,variant:`contained`,children:`新增账户`}):null]}),(0,R.jsx)(u,{color:`text.secondary`,variant:`body2`,sx:{pl:5.75},children:`整理家里的现金、银行卡、电子钱包和信用卡`})]}),(0,R.jsx)(de,{accounts:e,baseCurrency:n}),(0,R.jsxs)(s,{direction:`row`,spacing:.7,sx:U,children:[(0,R.jsx)(L,{label:`全部`,selected:f===`all`,onClick:()=>p(`all`)}),ne.filter(e=>e.value!==`other`).map(e=>(0,R.jsx)(L,{label:e.label,selected:f===e.value,onClick:()=>p(e.value)},e.value))]}),(0,R.jsx)(ue,{accounts:P,archiveAccountAction:j,canManageAccounts:r,emptyDescription:F?`请切换其他账户类型。`:r?void 0:`当前账本还没有可查看的账户。`,emptyTitle:F?`该类型下还没有账户`:void 0,holderOptions:l,saveResult:d,updateAccountAction:k})]}),i?(0,R.jsx)(pe,{}):null,r?(0,R.jsx)(N,{createAccountAction:D,defaultCurrency:n,holderOptions:l,onClose:()=>h(!1),open:m}):null,g.map((e,t)=>(0,R.jsx)(oe,{bottomOffset:_e(t),description:e.message,onClose:()=>ye(e.id),open:!0,title:`账户操作失败`},e.id)),(0,R.jsx)(ae,{bottomOffset:G,description:I.description,onClose:K,open:S,title:I.title})]})]})}function L({label:e,onClick:t,selected:n}){return(0,R.jsx)(a,{clickable:!0,color:n?`warning`:`default`,label:e,onClick:t,sx:{fontWeight:800},variant:n?`filled`:`outlined`})}function _e(e){return`calc(${G} + ${e*88}px)`}var R,z,B,V,H,U,W,G,ve,ye=t((()=>{R=r(),E(),A(),l(),f(),o(),m(),c(),d(),v(),i(),z=e(n()),h(),p(),F(),w(),T(),D(),k(),j(),M(),re(),B={},V={color:`text.primary`,mt:.2},H={px:{xs:.75},py:{xs:.75}},U={flexWrap:`nowrap`,mx:-.5,overflowX:`auto`,px:.5,scrollbarWidth:`none`,"&::-webkit-scrollbar":{display:`none`}},W={background:`var(--user-theme-fab-bg)`,borderRadius:999,color:`var(--user-theme-fab-text)`,flexShrink:0,fontWeight:800,minHeight:40,px:2,whiteSpace:`nowrap`,"&:hover":{background:`var(--user-theme-fab-bg)`,filter:`brightness(1.04)`}},G=`calc(${O.shellPaddingBottom} + 8px)`,ve={archived:{description:`账户已删除，历史记录不会被删除。`,title:`删除成功`},created:{description:`账户已创建。`,title:`新增成功`},updated:{description:`账户修改已保存。`,title:`保存成功`}},I.__docgenInfo={description:``,methods:[],displayName:`AccountsTemplate`,props:{accounts:{required:!0,tsType:{name:`Array`,elements:[{name:`Account`}],raw:`Account[]`},description:``},archiveAccountAction:{required:!0,tsType:{name:`AccountStateAction`},description:``},baseCurrency:{required:!0,tsType:{name:`string`},description:``},canManageAccounts:{required:!1,tsType:{name:`boolean`},description:``,defaultValue:{value:`true`,computed:!1}},canWriteTransactions:{required:!1,tsType:{name:`boolean`},description:``,defaultValue:{value:`true`,computed:!1}},createAccountAction:{required:!0,tsType:{name:`AccountStateAction`},description:``},initialErrorKey:{required:!1,tsType:{name:`union`,raw:`string | null`,elements:[{name:`string`},{name:`null`}]},description:``,defaultValue:{value:`null`,computed:!1}},initialErrorMessage:{required:!1,tsType:{name:`union`,raw:`string | null`,elements:[{name:`string`},{name:`null`}]},description:``,defaultValue:{value:`null`,computed:!1}},holderOptions:{required:!0,tsType:{name:`Array`,elements:[{name:`AccountHolderOption`}],raw:`AccountHolderOption[]`},description:``},ledgerName:{required:!0,tsType:{name:`string`},description:``},saveResult:{required:!1,tsType:{name:`union`,raw:`AccountSaveResult | null`,elements:[{name:`union`,raw:`"archived" | "created" | "updated"`,elements:[{name:`literal`,value:`"archived"`},{name:`literal`,value:`"created"`},{name:`literal`,value:`"updated"`}]},{name:`null`}]},description:``,defaultValue:{value:`null`,computed:!1}},updateAccountAction:{required:!0,tsType:{name:`AccountStateAction`},description:``}}}})),K,be,q,J,Y,X,Z,Q,$,xe;t((()=>{K=r(),g(),ye(),be={title:`Templates/Accounts/AccountsTemplate`,component:I,decorators:[e=>(0,K.jsx)(_,{storageScope:`storybook-accounts-template`,children:(0,K.jsx)(e,{})})],args:{accounts:[{id:`00000000-0000-4000-8000-000000000001`,name:`三菱UFJ银行`,type:`bank`,currency:`JPY`,initial_balance:1e5,current_balance:85e3,sort_order:1,created_at:`2026-01-01T00:00:00.000Z`,holders:[{id:`holder-1`,user_id:`user-1`,display_name:`本地开发用户`,email:`local1@example.test`,display_color:`sky`,role:`owner`,share_ratio:null}]},{id:`00000000-0000-4000-8000-000000000002`,name:`PayPay`,type:`e_money`,currency:`JPY`,initial_balance:0,current_balance:3200,sort_order:2,created_at:`2026-01-02T00:00:00.000Z`,holders:[]}],archiveAccountAction:async()=>({}),baseCurrency:`JPY`,createAccountAction:async()=>({}),holderOptions:[{user_id:`user-1`,display_name:`本地开发用户`,email:`local1@example.test`}],ledgerName:`家庭账本`,updateAccountAction:async()=>({})}},q={name:`账户页面`},J={name:`无账户`,args:{accounts:[]}},Y={name:`错误反馈弹窗`,args:{initialErrorKey:`story-error-key-1`,initialErrorMessage:`账户新增失败。请确认账户名称是否重复，或稍后重试。`}},X={name:`保存成功反馈`,args:{saveResult:`updated`}},Z={name:`新增成功反馈`,args:{saveResult:`created`}},Q={name:`删除成功反馈`,args:{saveResult:`archived`}},$={name:`多持有人多账户`,args:{holderOptions:[{user_id:`user-1`,display_name:`本地开发用户`,email:`local1@example.test`},{user_id:`user-2`,display_name:`本地开发用户2`,email:`local2@example.test`}],accounts:[{id:`00000000-0000-4000-8000-000000000001`,name:`三菱UFJ银行`,type:`bank`,currency:`JPY`,initial_balance:1e5,current_balance:85e3,sort_order:1,created_at:`2026-01-01T00:00:00.000Z`,holders:[{id:`holder-1`,user_id:`user-1`,display_name:`本地开发用户`,email:`local1@example.test`,display_color:`sky`,role:`co_owner`,share_ratio:null},{id:`holder-2`,user_id:`user-2`,display_name:`本地开发用户2`,email:`local2@example.test`,display_color:`sakura`,role:`co_owner`,share_ratio:null}]},{id:`00000000-0000-4000-8000-000000000002`,name:`楽天カード`,type:`credit_card`,currency:`JPY`,initial_balance:0,current_balance:-12500,sort_order:2,created_at:`2026-01-02T00:00:00.000Z`,holders:[{id:`holder-3`,user_id:`user-2`,display_name:`本地开发用户2`,email:`local2@example.test`,display_color:`sakura`,role:`owner`,share_ratio:null}]},{id:`00000000-0000-4000-8000-000000000003`,name:`PayPay`,type:`e_money`,currency:`JPY`,initial_balance:0,current_balance:3200,sort_order:3,created_at:`2026-01-03T00:00:00.000Z`,holders:[]}]}},q.parameters={...q.parameters,docs:{...q.parameters?.docs,source:{originalSource:`{
  name: "账户页面"
}`,...q.parameters?.docs?.source}}},J.parameters={...J.parameters,docs:{...J.parameters?.docs,source:{originalSource:`{
  name: "无账户",
  args: {
    accounts: []
  }
}`,...J.parameters?.docs?.source}}},Y.parameters={...Y.parameters,docs:{...Y.parameters?.docs,source:{originalSource:`{
  name: "错误反馈弹窗",
  args: {
    initialErrorKey: "story-error-key-1",
    initialErrorMessage: "账户新增失败。请确认账户名称是否重复，或稍后重试。"
  }
}`,...Y.parameters?.docs?.source}}},X.parameters={...X.parameters,docs:{...X.parameters?.docs,source:{originalSource:`{
  name: "保存成功反馈",
  args: {
    saveResult: "updated"
  }
}`,...X.parameters?.docs?.source}}},Z.parameters={...Z.parameters,docs:{...Z.parameters?.docs,source:{originalSource:`{
  name: "新增成功反馈",
  args: {
    saveResult: "created"
  }
}`,...Z.parameters?.docs?.source}}},Q.parameters={...Q.parameters,docs:{...Q.parameters?.docs,source:{originalSource:`{
  name: "删除成功反馈",
  args: {
    saveResult: "archived"
  }
}`,...Q.parameters?.docs?.source}}},$.parameters={...$.parameters,docs:{...$.parameters?.docs,source:{originalSource:`{
  name: "多持有人多账户",
  args: {
    holderOptions: [{
      user_id: "user-1",
      display_name: "本地开发用户",
      email: "local1@example.test"
    }, {
      user_id: "user-2",
      display_name: "本地开发用户2",
      email: "local2@example.test"
    }],
    accounts: [{
      id: "00000000-0000-4000-8000-000000000001",
      name: "三菱UFJ银行",
      type: "bank",
      currency: "JPY",
      initial_balance: 100000,
      current_balance: 85000,
      sort_order: 1,
      created_at: "2026-01-01T00:00:00.000Z",
      holders: [{
        id: "holder-1",
        user_id: "user-1",
        display_name: "本地开发用户",
        email: "local1@example.test",
        display_color: "sky",
        role: "co_owner",
        share_ratio: null
      }, {
        id: "holder-2",
        user_id: "user-2",
        display_name: "本地开发用户2",
        email: "local2@example.test",
        display_color: "sakura",
        role: "co_owner",
        share_ratio: null
      }]
    }, {
      id: "00000000-0000-4000-8000-000000000002",
      name: "楽天カード",
      type: "credit_card",
      currency: "JPY",
      initial_balance: 0,
      current_balance: -12500,
      sort_order: 2,
      created_at: "2026-01-02T00:00:00.000Z",
      holders: [{
        id: "holder-3",
        user_id: "user-2",
        display_name: "本地开发用户2",
        email: "local2@example.test",
        display_color: "sakura",
        role: "owner",
        share_ratio: null
      }]
    }, {
      id: "00000000-0000-4000-8000-000000000003",
      name: "PayPay",
      type: "e_money",
      currency: "JPY",
      initial_balance: 0,
      current_balance: 3200,
      sort_order: 3,
      created_at: "2026-01-03T00:00:00.000Z",
      holders: []
    }]
  }
}`,...$.parameters?.docs?.source}}},xe=[`Default`,`Empty`,`WithError`,`SaveSucceeded`,`CreateSucceeded`,`ArchiveSucceeded`,`MultipleHolders`]}))();export{Q as ArchiveSucceeded,Z as CreateSucceeded,q as Default,J as Empty,$ as MultipleHolders,X as SaveSucceeded,Y as WithError,xe as __namedExportsOrder,be as default};