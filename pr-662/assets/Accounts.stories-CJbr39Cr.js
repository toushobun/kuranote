import{c as e,i as t}from"./preload-helper-D2yxXLVK.js";import{t as n}from"./react-DAMDAfNa.js";import{t as r}from"./jsx-runtime-Dwpk6tgA.js";import{F as ee,N as te}from"./iframe-CGcJZ1pN.js";import{n as i,t as a}from"./Chip-Dk_3-59y.js";import{n as o,t as s}from"./Stack-DRbcmy6F.js";import{n as ne,t as c}from"./Box-C-mvLTRv.js";import{n as l,t as u}from"./Typography-CwLqrFKa.js";import{a as re,n as ie}from"./paths-CQl5VVu_.js";import{n as d,t as f}from"./UserThemeProvider-D8TDkwP6.js";import{n as ae,t as oe}from"./Button-BvhFbL6z.js";import{n as se,t as p}from"./link-Du4AGLbo.js";import{a as ce,o as le}from"./accounts-DpbEXm7k.js";import{a as ue,i as de,o as m}from"./OperationFeedbackDialogs-BF7ZVflI.js";import{n as fe,t as h}from"./IconButton-BvjujjMV.js";import{n as g,t as _}from"./AccountForm-CuZTHcfN.js";import{n as v,r as y,t as b}from"./AccountFormDialogShell-Cdfbdkv9.js";import{n as x,t as pe}from"./AccountList-CP352WzT.js";import{n as S,t as me}from"./AccountSummaryCard-CkwEusQu.js";import{n as C,t as he}from"./AddRounded-ij6gkWwb.js";import{n as w,t as T}from"./bottomNavigationLayout-CJbBjEhY.js";import{n as E,t as ge}from"./TransactionAmountKeypadLauncher-BbN3M0bo.js";import{n as D,t as _e}from"./ArrowBackRounded-CxlZpNyn.js";import{n as O,t as ve}from"./PageShell-CQKhKWTC.js";import{n as k,t as ye}from"./fullViewportPageBackgroundSx-BEsR-Htf.js";function A({createAccountAction:e,defaultCurrency:t,holderOptions:n,onClose:r,open:ee}){return(0,j.jsx)(v,{illustrationSlot:(0,j.jsx)(b,{}),onClose:r,open:ee,children:(0,j.jsx)(_,{createAccountAction:e,defaultCurrency:t,holderOptions:n,onCancel:r})})}var j,M=t((()=>{j=r(),g(),y(),A.__docgenInfo={description:``,methods:[],displayName:`AccountCreateDialog`,props:{createAccountAction:{required:!0,tsType:{name:`ServerAction`},description:``},defaultCurrency:{required:!0,tsType:{name:`string`},description:``},holderOptions:{required:!0,tsType:{name:`Array`,elements:[{name:`AccountHolderOption`}],raw:`AccountHolderOption[]`},description:``},onClose:{required:!0,tsType:{name:`signature`,type:`function`,raw:`() => void`,signature:{arguments:[],return:{name:`void`}}},description:``},open:{required:!0,tsType:{name:`boolean`},description:``}}}}));function N({accounts:e,archiveAccountAction:t,baseCurrency:n,canManageAccounts:r=!0,canWriteTransactions:te=!0,createAccountAction:i,initialErrorKey:a=null,initialErrorMessage:s=null,holderOptions:c,saveResult:u=null,updateAccountAction:ie}){let[d,f]=(0,I.useState)(`all`),[oe,p]=(0,I.useState)(!1),[le,m]=(0,I.useState)([]),h=(0,I.useRef)(0),g=(0,I.useRef)(new Set),[_,v]=(0,I.useState)(u),[y,b]=(0,I.useState)(u!==null),[x,S]=(0,I.useState)(u),[C,w]=(0,I.useActionState)(i,L),[T,E]=(0,I.useActionState)(ie,L),[D,O]=(0,I.useActionState)(t,L),k=ee();(0,I.useEffect)(()=>{let e=[{error:s??void 0,errorKey:a??void 0},C,T,D];for(let t of e){if(!t.error||!t.errorKey||g.current.has(t.errorKey))continue;g.current.add(t.errorKey),h.current+=1;let e=`${t.errorKey}-${h.current}`;m(n=>[...n,{id:e,message:t.error}])}},[D,C,a,s,T]),u!==x&&(S(u),u!==null&&(v(u),b(!0),p(!1)));let j=(0,I.useMemo)(()=>d===`all`?e:e.filter(e=>e.type===d),[e,d]),M=d!==`all`&&j.length===0,N=U[_??`updated`];function W(e){m(t=>t.filter(t=>t.id!==e))}function G(){b(!1);let e=new URL(window.location.href);e.searchParams.delete(`result`),k.replace(`${e.pathname}${e.search}${e.hash}`,{scroll:!1})}return(0,F.jsxs)(F.Fragment,{children:[(0,F.jsx)(ne,{"aria-hidden":`true`,"data-testid":`accounts-page-background`,sx:ye}),(0,F.jsxs)(ve,{maxWidth:`xs`,sx:z,children:[(0,F.jsxs)(o,{spacing:1.35,children:[(0,F.jsxs)(o,{spacing:.4,children:[(0,F.jsxs)(o,{direction:`row`,spacing:.75,sx:{alignItems:`center`},children:[(0,F.jsx)(fe,{"aria-label":`返回`,component:se,href:re.settings,sx:R,children:(0,F.jsx)(_e,{})}),(0,F.jsx)(l,{component:`h1`,sx:{flex:1,fontSize:{xs:24,sm:26},fontWeight:900},children:`账户管理`}),r?(0,F.jsx)(ae,{onClick:()=>p(!0),startIcon:(0,F.jsx)(he,{}),sx:V,variant:`contained`,children:`新增账户`}):null]}),(0,F.jsx)(l,{color:`text.secondary`,variant:`body2`,sx:{pl:5.75},children:`整理家里的现金、银行卡、电子钱包和信用卡`})]}),(0,F.jsx)(me,{accounts:e,baseCurrency:n}),(0,F.jsxs)(o,{direction:`row`,spacing:.7,sx:B,children:[(0,F.jsx)(P,{label:`全部`,selected:d===`all`,onClick:()=>f(`all`)}),ce.filter(e=>e.value!==`other`).map(e=>(0,F.jsx)(P,{label:e.label,selected:d===e.value,onClick:()=>f(e.value)},e.value))]}),(0,F.jsx)(pe,{accounts:j,archiveAccountAction:O,canManageAccounts:r,emptyDescription:M?`请切换其他账户类型。`:r?void 0:`当前账本还没有可查看的账户。`,emptyTitle:M?`该类型下还没有账户`:void 0,holderOptions:c,saveResult:u,updateAccountAction:E})]}),te?(0,F.jsx)(ge,{}):null,r?(0,F.jsx)(A,{createAccountAction:w,defaultCurrency:n,holderOptions:c,onClose:()=>p(!1),open:oe}):null,le.map((e,t)=>(0,F.jsx)(de,{bottomOffset:be(t),description:e.message,onClose:()=>W(e.id),open:!0,title:`账户操作失败`},e.id)),(0,F.jsx)(ue,{bottomOffset:H,description:N.description,onClose:G,open:y,title:N.title})]})]})}function P({label:e,onClick:t,selected:n}){return(0,F.jsx)(i,{clickable:!0,color:n?`warning`:`default`,label:e,onClick:t,sx:{fontWeight:800},variant:n?`filled`:`outlined`})}function be(e){return`calc(${H} + ${e*88}px)`}var F,I,L,R,z,B,V,H,U,W=t((()=>{F=r(),C(),D(),c(),oe(),a(),h(),s(),u(),p(),te(),I=e(n()),ie(),m(),M(),x(),S(),w(),E(),O(),k(),le(),L={},R={color:`text.primary`,mt:.2},z={px:{xs:.75},py:{xs:.75}},B={flexWrap:`nowrap`,mx:-.5,overflowX:`auto`,px:.5,scrollbarWidth:`none`,"&::-webkit-scrollbar":{display:`none`}},V={background:`var(--user-theme-fab-bg)`,borderRadius:999,color:`var(--user-theme-fab-text)`,flexShrink:0,fontWeight:800,minHeight:40,px:2,whiteSpace:`nowrap`,"&:hover":{background:`var(--user-theme-fab-bg)`,filter:`brightness(1.04)`}},H=`calc(${T.shellPaddingBottom} + 8px)`,U={archived:{description:`账户已删除，历史记录不会被删除。`,title:`删除成功`},created:{description:`账户已创建。`,title:`新增成功`},updated:{description:`账户修改已保存。`,title:`保存成功`}},N.__docgenInfo={description:``,methods:[],displayName:`AccountsTemplate`,props:{accounts:{required:!0,tsType:{name:`Array`,elements:[{name:`Account`}],raw:`Account[]`},description:``},archiveAccountAction:{required:!0,tsType:{name:`AccountStateAction`},description:``},baseCurrency:{required:!0,tsType:{name:`string`},description:``},canManageAccounts:{required:!1,tsType:{name:`boolean`},description:``,defaultValue:{value:`true`,computed:!1}},canWriteTransactions:{required:!1,tsType:{name:`boolean`},description:``,defaultValue:{value:`true`,computed:!1}},createAccountAction:{required:!0,tsType:{name:`AccountStateAction`},description:``},initialErrorKey:{required:!1,tsType:{name:`union`,raw:`string | null`,elements:[{name:`string`},{name:`null`}]},description:``,defaultValue:{value:`null`,computed:!1}},initialErrorMessage:{required:!1,tsType:{name:`union`,raw:`string | null`,elements:[{name:`string`},{name:`null`}]},description:``,defaultValue:{value:`null`,computed:!1}},holderOptions:{required:!0,tsType:{name:`Array`,elements:[{name:`AccountHolderOption`}],raw:`AccountHolderOption[]`},description:``},ledgerName:{required:!0,tsType:{name:`string`},description:``},saveResult:{required:!1,tsType:{name:`union`,raw:`AccountSaveResult | null`,elements:[{name:`union`,raw:`"archived" | "created" | "updated"`,elements:[{name:`literal`,value:`"archived"`},{name:`literal`,value:`"created"`},{name:`literal`,value:`"updated"`}]},{name:`null`}]},description:``,defaultValue:{value:`null`,computed:!1}},updateAccountAction:{required:!0,tsType:{name:`AccountStateAction`},description:``}}}})),G,K,q,J,Y,X,Z,Q,$,xe;t((()=>{G=r(),d(),W(),K={title:`Templates/Accounts/AccountsTemplate`,component:N,decorators:[e=>(0,G.jsx)(f,{storageScope:`storybook-accounts-template`,children:(0,G.jsx)(e,{})})],args:{accounts:[{id:`00000000-0000-4000-8000-000000000001`,name:`三菱UFJ银行`,type:`bank`,currency:`JPY`,initial_balance:1e5,current_balance:85e3,sort_order:1,created_at:`2026-01-01T00:00:00.000Z`,holders:[{id:`holder-1`,user_id:`user-1`,display_name:`本地开发用户`,email:`local1@example.test`,display_color:`sky`,role:`owner`,share_ratio:null}]},{id:`00000000-0000-4000-8000-000000000002`,name:`PayPay`,type:`e_money`,currency:`JPY`,initial_balance:0,current_balance:3200,sort_order:2,created_at:`2026-01-02T00:00:00.000Z`,holders:[]}],archiveAccountAction:async()=>({}),baseCurrency:`JPY`,createAccountAction:async()=>({}),holderOptions:[{user_id:`user-1`,display_name:`本地开发用户`,email:`local1@example.test`}],ledgerName:`家庭账本`,updateAccountAction:async()=>({})}},q={name:`账户页面`},J={name:`无账户`,args:{accounts:[]}},Y={name:`错误反馈弹窗`,args:{initialErrorKey:`story-error-key-1`,initialErrorMessage:`账户新增失败。请确认账户名称是否重复，或稍后重试。`}},X={name:`保存成功反馈`,args:{saveResult:`updated`}},Z={name:`新增成功反馈`,args:{saveResult:`created`}},Q={name:`删除成功反馈`,args:{saveResult:`archived`}},$={name:`多持有人多账户`,args:{holderOptions:[{user_id:`user-1`,display_name:`本地开发用户`,email:`local1@example.test`},{user_id:`user-2`,display_name:`本地开发用户2`,email:`local2@example.test`}],accounts:[{id:`00000000-0000-4000-8000-000000000001`,name:`三菱UFJ银行`,type:`bank`,currency:`JPY`,initial_balance:1e5,current_balance:85e3,sort_order:1,created_at:`2026-01-01T00:00:00.000Z`,holders:[{id:`holder-1`,user_id:`user-1`,display_name:`本地开发用户`,email:`local1@example.test`,display_color:`sky`,role:`co_owner`,share_ratio:null},{id:`holder-2`,user_id:`user-2`,display_name:`本地开发用户2`,email:`local2@example.test`,display_color:`sakura`,role:`co_owner`,share_ratio:null}]},{id:`00000000-0000-4000-8000-000000000002`,name:`楽天カード`,type:`credit_card`,currency:`JPY`,initial_balance:0,current_balance:-12500,sort_order:2,created_at:`2026-01-02T00:00:00.000Z`,holders:[{id:`holder-3`,user_id:`user-2`,display_name:`本地开发用户2`,email:`local2@example.test`,display_color:`sakura`,role:`owner`,share_ratio:null}]},{id:`00000000-0000-4000-8000-000000000003`,name:`PayPay`,type:`e_money`,currency:`JPY`,initial_balance:0,current_balance:3200,sort_order:3,created_at:`2026-01-03T00:00:00.000Z`,holders:[]}]}},q.parameters={...q.parameters,docs:{...q.parameters?.docs,source:{originalSource:`{
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
}`,...$.parameters?.docs?.source}}},xe=[`Default`,`Empty`,`WithError`,`SaveSucceeded`,`CreateSucceeded`,`ArchiveSucceeded`,`MultipleHolders`]}))();export{Q as ArchiveSucceeded,Z as CreateSucceeded,q as Default,J as Empty,$ as MultipleHolders,X as SaveSucceeded,Y as WithError,xe as __namedExportsOrder,K as default};