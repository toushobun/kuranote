import{c as e,i as t}from"./preload-helper-D2yxXLVK.js";import{t as n}from"./react-DAMDAfNa.js";import{t as r}from"./jsx-runtime-Dwpk6tgA.js";import{n as i,t as ee}from"./iframe-DMvcIK1a.js";import{n as a,t as o}from"./Chip-Dk_3-59y.js";import{n as s,t as c}from"./Stack-DRbcmy6F.js";import{n as te,t as l}from"./Box-xGwLOzTx.js";import{n as u,t as d}from"./Typography-CwLqrFKa.js";import{a as ne,n as f}from"./paths-BabFpEj2.js";import{n as p,t as re}from"./UserThemeProvider-Bxr6OP0n.js";import{n as ie,t as m}from"./link-Du4AGLbo.js";import{a as ae,o as h}from"./accounts-DpbEXm7k.js";import{a as oe,i as se,o as g}from"./OperationFeedbackDialogs-BpqERNoy.js";import{n as ce,t as _}from"./IconButton-BvjujjMV.js";import{n as v,t as y}from"./bottomNavigationLayout-DRTfLiI_.js";import{n as b,t as le}from"./AccountForm-B_Z71r7_.js";import{n as x,r as ue,t as de}from"./AccountFormDialogShell-CW3MkKF-.js";import{n as S,t as fe}from"./AccountList-BEOU7sFp.js";import{n as pe,t as me}from"./AccountSummaryCard-qor1VxO2.js";import{n as C,t as he}from"./CreateButton-98cd2AAU.js";import{n as w,t as ge}from"./TransactionAmountKeypadLauncher-BlZoGPmC.js";import{n as T,t as _e}from"./ArrowBackRounded-CxlZpNyn.js";import{n as E,t as ve}from"./PageShell-hBMp3jTI.js";import{n as D,t as ye}from"./fullViewportPageBackgroundSx-BEsR-Htf.js";import{n as be,t as O}from"./useClearQueryParam-D1zc0kxP.js";function k({createAccountAction:e,defaultCurrency:t,holderOptions:n,onClose:r,open:i}){return(0,A.jsx)(x,{illustrationSlot:(0,A.jsx)(de,{}),onClose:r,open:i,children:(0,A.jsx)(le,{createAccountAction:e,defaultCurrency:t,holderOptions:n,onCancel:r})})}var A,j=t((()=>{A=r(),b(),ue(),k.__docgenInfo={description:``,methods:[],displayName:`AccountCreateDialog`,props:{createAccountAction:{required:!0,tsType:{name:`ServerAction`},description:``},defaultCurrency:{required:!0,tsType:{name:`string`},description:``},holderOptions:{required:!0,tsType:{name:`Array`,elements:[{name:`AccountHolderOption`}],raw:`AccountHolderOption[]`},description:``},onClose:{required:!0,tsType:{name:`signature`,type:`function`,raw:`() => void`,signature:{arguments:[],return:{name:`void`}}},description:``},open:{required:!0,tsType:{name:`boolean`},description:``}}}}));function M({accounts:e,archiveAccountAction:t,baseCurrency:n,canManageAccounts:r=!0,canWriteTransactions:i=!0,createAccountAction:ee,initialErrorKey:a=null,initialErrorMessage:o=null,holderOptions:c,saveResult:l=null,updateAccountAction:d}){let[f,p]=(0,F.useState)(`all`),[re,m]=(0,F.useState)(!1),[h,g]=(0,F.useState)([]),_=(0,F.useRef)(0),v=(0,F.useRef)(new Set),[y,b]=(0,F.useState)(l),[le,x]=(0,F.useState)(l!==null),[ue,de]=(0,F.useState)(l),[S,pe]=(0,F.useActionState)(ee,I),[C,w]=(0,F.useActionState)(d,I),[T,E]=(0,F.useActionState)(t,I),D=be(`result`);(0,F.useEffect)(()=>{let e=[{error:o??void 0,errorKey:a??void 0},S,C,T];for(let t of e){if(!t.error||!t.errorKey||v.current.has(t.errorKey))continue;v.current.add(t.errorKey),_.current+=1;let e=`${t.errorKey}-${_.current}`;g(n=>[...n,{id:e,message:t.error}])}},[T,S,a,o,C]),l!==ue&&(de(l),l!==null&&(b(l),x(!0),m(!1)));let O=(0,F.useMemo)(()=>f===`all`?e:e.filter(e=>e.type===f),[e,f]),A=f!==`all`&&O.length===0,j=W[y??`updated`];function M(e){g(t=>t.filter(t=>t.id!==e))}function L(){x(!1),D()}return(0,P.jsxs)(P.Fragment,{children:[(0,P.jsx)(te,{"aria-hidden":`true`,"data-testid":`accounts-page-background`,sx:ye}),(0,P.jsxs)(ve,{maxWidth:`xs`,sx:B,children:[(0,P.jsxs)(s,{spacing:1.35,children:[(0,P.jsxs)(s,{spacing:.4,children:[(0,P.jsxs)(s,{direction:`row`,spacing:.75,sx:{alignItems:`center`},children:[(0,P.jsx)(ce,{"aria-label":`返回`,component:ie,href:ne.settings,sx:z,children:(0,P.jsx)(_e,{})}),(0,P.jsx)(u,{component:`h1`,sx:{flex:1,fontSize:{xs:24,sm:26},fontWeight:900},children:`账户管理`}),r?(0,P.jsx)(he,{onClick:()=>m(!0),sx:H,children:`新增账户`}):null]}),(0,P.jsx)(u,{color:`text.secondary`,variant:`body2`,sx:{pl:5.75},children:`整理家里的现金、银行卡、电子钱包和信用卡`})]}),(0,P.jsx)(me,{accounts:e,baseCurrency:n}),(0,P.jsxs)(s,{direction:`row`,spacing:.7,sx:V,children:[(0,P.jsx)(N,{label:`全部`,selected:f===`all`,onClick:()=>p(`all`)}),ae.filter(e=>e.value!==`other`).map(e=>(0,P.jsx)(N,{label:e.label,selected:f===e.value,onClick:()=>p(e.value)},e.value))]}),(0,P.jsx)(fe,{accounts:O,archiveAccountAction:E,canManageAccounts:r,emptyDescription:A?`请切换其他账户类型。`:r?void 0:`当前账本还没有可查看的账户。`,emptyTitle:A?`该类型下还没有账户`:void 0,holderOptions:c,saveResult:l,updateAccountAction:w})]}),i?(0,P.jsx)(ge,{}):null,r?(0,P.jsx)(k,{createAccountAction:pe,defaultCurrency:n,holderOptions:c,onClose:()=>m(!1),open:re}):null,h.map((e,t)=>(0,P.jsx)(se,{bottomOffset:xe(t),description:e.message,onClose:()=>M(e.id),open:!0,title:`账户操作失败`},e.id)),(0,P.jsx)(oe,{bottomOffset:U,description:j.description,onClose:L,open:le,title:j.title})]})]})}function N({label:e,onClick:t,selected:n}){return(0,P.jsx)(a,{clickable:!0,color:n?`warning`:`default`,label:e,onClick:t,sx:[{fontWeight:800},n?R:L],variant:n?`filled`:`outlined`})}function xe(e){return`calc(${U} + ${e*88}px)`}var P,F,I,L,R,z,B,V,H,U,W,Se=t((()=>{P=r(),T(),l(),o(),_(),c(),d(),m(),F=e(n()),C(),f(),g(),j(),S(),pe(),v(),w(),E(),D(),O(),i(),h(),I={},L={"@media (hover: hover)":{"&&.MuiChip-clickable:hover":{bgcolor:`action.hover`}},"@media (hover: none)":{"&&.MuiChip-clickable":{bgcolor:`transparent`}}},R={"@media (hover: hover)":{"&&.MuiChip-clickable:hover":{bgcolor:`warning.main`}},"@media (hover: none)":{"&&.MuiChip-clickable":{bgcolor:`warning.main`}}},z={color:`text.primary`,mt:.2},B={px:{xs:.75},py:{xs:.75}},V={flexWrap:`nowrap`,mx:-.5,overflowX:`auto`,px:.5,scrollbarWidth:`none`,"&::-webkit-scrollbar":{display:`none`}},H={borderRadius:`${ee.radius.full}px`,flexShrink:0,fontWeight:800,minHeight:40,px:2,whiteSpace:`nowrap`},U=`calc(${y.shellPaddingBottom} + 8px)`,W={archived:{description:`账户已删除，历史记录不会被删除。`,title:`删除成功`},created:{description:`账户已创建。`,title:`新增成功`},updated:{description:`账户修改已保存。`,title:`保存成功`}},M.__docgenInfo={description:``,methods:[],displayName:`AccountsTemplate`,props:{accounts:{required:!0,tsType:{name:`Array`,elements:[{name:`Account`}],raw:`Account[]`},description:``},archiveAccountAction:{required:!0,tsType:{name:`AccountStateAction`},description:``},baseCurrency:{required:!0,tsType:{name:`string`},description:``},canManageAccounts:{required:!1,tsType:{name:`boolean`},description:``,defaultValue:{value:`true`,computed:!1}},canWriteTransactions:{required:!1,tsType:{name:`boolean`},description:``,defaultValue:{value:`true`,computed:!1}},createAccountAction:{required:!0,tsType:{name:`AccountStateAction`},description:``},initialErrorKey:{required:!1,tsType:{name:`union`,raw:`string | null`,elements:[{name:`string`},{name:`null`}]},description:``,defaultValue:{value:`null`,computed:!1}},initialErrorMessage:{required:!1,tsType:{name:`union`,raw:`string | null`,elements:[{name:`string`},{name:`null`}]},description:``,defaultValue:{value:`null`,computed:!1}},holderOptions:{required:!0,tsType:{name:`Array`,elements:[{name:`AccountHolderOption`}],raw:`AccountHolderOption[]`},description:``},ledgerName:{required:!0,tsType:{name:`string`},description:``},saveResult:{required:!1,tsType:{name:`union`,raw:`AccountSaveResult | null`,elements:[{name:`union`,raw:`"archived" | "created" | "updated"`,elements:[{name:`literal`,value:`"archived"`},{name:`literal`,value:`"created"`},{name:`literal`,value:`"updated"`}]},{name:`null`}]},description:``,defaultValue:{value:`null`,computed:!1}},updateAccountAction:{required:!0,tsType:{name:`AccountStateAction`},description:``}}}})),G,Ce,K,q,J,Y,X,Z,Q,$;t((()=>{G=r(),p(),Se(),Ce={title:`Templates/Accounts/AccountsTemplate`,component:M,decorators:[e=>(0,G.jsx)(re,{storageScope:`storybook-accounts-template`,children:(0,G.jsx)(e,{})})],args:{accounts:[{id:`00000000-0000-4000-8000-000000000001`,name:`三菱UFJ银行`,type:`bank`,currency:`JPY`,initial_balance:1e5,current_balance:85e3,sort_order:1,created_at:`2026-01-01T00:00:00.000Z`,holders:[{id:`holder-1`,user_id:`user-1`,display_name:`本地开发用户`,email:`local1@example.test`,display_color:`sky`,role:`owner`,share_ratio:null}]},{id:`00000000-0000-4000-8000-000000000002`,name:`PayPay`,type:`e_money`,currency:`JPY`,initial_balance:0,current_balance:3200,sort_order:2,created_at:`2026-01-02T00:00:00.000Z`,holders:[]}],archiveAccountAction:async()=>({}),baseCurrency:`JPY`,createAccountAction:async()=>({}),holderOptions:[{user_id:`user-1`,display_name:`本地开发用户`,email:`local1@example.test`}],ledgerName:`家庭账本`,updateAccountAction:async()=>({})}},K={name:`账户页面`},q={name:`无账户`,args:{accounts:[]}},J={name:`错误反馈弹窗`,args:{initialErrorKey:`story-error-key-1`,initialErrorMessage:`账户新增失败。请确认账户名称是否重复，或稍后重试。`}},Y={name:`保存成功反馈`,args:{saveResult:`updated`}},X={name:`新增成功反馈`,args:{saveResult:`created`}},Z={name:`删除成功反馈`,args:{saveResult:`archived`}},Q={name:`多持有人多账户`,args:{holderOptions:[{user_id:`user-1`,display_name:`本地开发用户`,email:`local1@example.test`},{user_id:`user-2`,display_name:`本地开发用户2`,email:`local2@example.test`}],accounts:[{id:`00000000-0000-4000-8000-000000000001`,name:`三菱UFJ银行`,type:`bank`,currency:`JPY`,initial_balance:1e5,current_balance:85e3,sort_order:1,created_at:`2026-01-01T00:00:00.000Z`,holders:[{id:`holder-1`,user_id:`user-1`,display_name:`本地开发用户`,email:`local1@example.test`,display_color:`sky`,role:`co_owner`,share_ratio:null},{id:`holder-2`,user_id:`user-2`,display_name:`本地开发用户2`,email:`local2@example.test`,display_color:`sakura`,role:`co_owner`,share_ratio:null}]},{id:`00000000-0000-4000-8000-000000000002`,name:`楽天カード`,type:`credit_card`,currency:`JPY`,initial_balance:0,current_balance:-12500,sort_order:2,created_at:`2026-01-02T00:00:00.000Z`,holders:[{id:`holder-3`,user_id:`user-2`,display_name:`本地开发用户2`,email:`local2@example.test`,display_color:`sakura`,role:`owner`,share_ratio:null}]},{id:`00000000-0000-4000-8000-000000000003`,name:`PayPay`,type:`e_money`,currency:`JPY`,initial_balance:0,current_balance:3200,sort_order:3,created_at:`2026-01-03T00:00:00.000Z`,holders:[]}]}},K.parameters={...K.parameters,docs:{...K.parameters?.docs,source:{originalSource:`{
  name: "账户页面"
}`,...K.parameters?.docs?.source}}},q.parameters={...q.parameters,docs:{...q.parameters?.docs,source:{originalSource:`{
  name: "无账户",
  args: {
    accounts: []
  }
}`,...q.parameters?.docs?.source}}},J.parameters={...J.parameters,docs:{...J.parameters?.docs,source:{originalSource:`{
  name: "错误反馈弹窗",
  args: {
    initialErrorKey: "story-error-key-1",
    initialErrorMessage: "账户新增失败。请确认账户名称是否重复，或稍后重试。"
  }
}`,...J.parameters?.docs?.source}}},Y.parameters={...Y.parameters,docs:{...Y.parameters?.docs,source:{originalSource:`{
  name: "保存成功反馈",
  args: {
    saveResult: "updated"
  }
}`,...Y.parameters?.docs?.source}}},X.parameters={...X.parameters,docs:{...X.parameters?.docs,source:{originalSource:`{
  name: "新增成功反馈",
  args: {
    saveResult: "created"
  }
}`,...X.parameters?.docs?.source}}},Z.parameters={...Z.parameters,docs:{...Z.parameters?.docs,source:{originalSource:`{
  name: "删除成功反馈",
  args: {
    saveResult: "archived"
  }
}`,...Z.parameters?.docs?.source}}},Q.parameters={...Q.parameters,docs:{...Q.parameters?.docs,source:{originalSource:`{
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
}`,...Q.parameters?.docs?.source}}},$=[`Default`,`Empty`,`WithError`,`SaveSucceeded`,`CreateSucceeded`,`ArchiveSucceeded`,`MultipleHolders`]}))();export{Z as ArchiveSucceeded,X as CreateSucceeded,K as Default,q as Empty,Q as MultipleHolders,Y as SaveSucceeded,J as WithError,$ as __namedExportsOrder,Ce as default};