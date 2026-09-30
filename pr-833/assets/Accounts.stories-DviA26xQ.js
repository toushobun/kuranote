import{c as e,i as t}from"./preload-helper-D2yxXLVK.js";import{t as n}from"./react-DAMDAfNa.js";import{t as r}from"./jsx-runtime-Dwpk6tgA.js";import{n as i,t as a}from"./iframe-B7rcrqgM.js";import{n as o,t as s}from"./Chip-DcyRJ30y.js";import{n as c,t as l}from"./Stack-DRbcmy6F.js";import{n as ee,t as u}from"./Box-Dd4NpSit.js";import{n as d,t as f}from"./Typography-CwLqrFKa.js";import{a as te,n as ne}from"./paths-t1fEWS--.js";import{n as p,t as m}from"./UserThemeProvider-D4TWBDBM.js";import{n as re,t as ie}from"./link-Du4AGLbo.js";import{a as ae}from"./account-DeUkA5tX.js";import{a as h}from"./accounts-ama5jf5a.js";import{a as oe,i as se,o as g}from"./OperationFeedbackDialogs-BEErQPkC.js";import{n as ce,t as _}from"./IconButton-DgEIThjY.js";import{n as v,t as le}from"./bottomNavigationLayout-Cdb2oCqw.js";import{n as y,t as b}from"./AccountForm-CuWaBKJN.js";import{n as x,r as S,t as C}from"./AccountFormDialogShell-Cj21_dU5.js";import{n as w,t as ue}from"./AccountList-QM8gs7o0.js";import{n as de,t as fe}from"./AccountSummaryCard-D4f7xLlO.js";import{n as T,t as pe}from"./CreateButton-C9-KTghs.js";import{n as E,t as me}from"./TransactionAmountKeypadLauncher-mK2g7BsO.js";import{n as D,t as he}from"./ArrowBackRounded-CxlZpNyn.js";import{n as O,t as ge}from"./PageShell-NQS0CdiB.js";import{n as k,t as _e}from"./fullViewportPageBackgroundSx-BEsR-Htf.js";import{n as ve,t as A}from"./useClearQueryParam-ZdgYvqAw.js";function j({createAccountAction:e,defaultCurrency:t,holderOptions:n,onClose:r,open:i,placeholderHolderOptions:a=[]}){return(0,M.jsx)(x,{illustrationSlot:(0,M.jsx)(C,{}),onClose:r,open:i,children:(0,M.jsx)(b,{createAccountAction:e,defaultCurrency:t,holderOptions:n,onCancel:r,placeholderHolderOptions:a})})}var M,N=t((()=>{M=r(),y(),S(),j.__docgenInfo={description:``,methods:[],displayName:`AccountCreateDialog`,props:{createAccountAction:{required:!0,tsType:{name:`ServerAction`},description:``},defaultCurrency:{required:!0,tsType:{name:`string`},description:``},holderOptions:{required:!0,tsType:{name:`Array`,elements:[{name:`AccountHolderOption`}],raw:`AccountHolderOption[]`},description:``},onClose:{required:!0,tsType:{name:`signature`,type:`function`,raw:`() => void`,signature:{arguments:[],return:{name:`void`}}},description:``},open:{required:!0,tsType:{name:`boolean`},description:``},placeholderHolderOptions:{required:!1,tsType:{name:`Array`,elements:[{name:`AccountPlaceholderHolderOption`}],raw:`AccountPlaceholderHolderOption[]`},description:``,defaultValue:{value:`[]`,computed:!1}}}}}));function P({accounts:e,archiveAccountAction:t,baseCurrency:n,canManageAccounts:r=!0,canWriteTransactions:i=!0,createAccountAction:a,initialErrorKey:o=null,initialErrorMessage:s=null,holderOptions:l,placeholderHolderOptions:u=[],saveResult:f=null,updateAccountAction:ne}){let[p,m]=(0,L.useState)(`all`),[ie,h]=(0,L.useState)(!1),[g,_]=(0,L.useState)([]),v=(0,L.useRef)(0),y=(0,L.useRef)(new Set),[b,x]=(0,L.useState)(f),[S,C]=(0,L.useState)(f!==null),[w,de]=(0,L.useState)(f),[T,E]=(0,L.useActionState)(a,R),[D,O]=(0,L.useActionState)(ne,R),[k,A]=(0,L.useActionState)(t,R),M=ve(`result`);(0,L.useEffect)(()=>{let e=[{error:s??void 0,errorKey:o??void 0},T,D,k];for(let t of e){if(!t.error||!t.errorKey||y.current.has(t.errorKey))continue;y.current.add(t.errorKey),v.current+=1;let e=`${t.errorKey}-${v.current}`;_(n=>[...n,{id:e,message:t.error}])}},[k,T,o,s,D]),f!==w&&(de(f),f!==null&&(x(f),C(!0),h(!1)));let N=(0,L.useMemo)(()=>p===`all`?e:e.filter(e=>e.type===p),[e,p]),P=p!==`all`&&N.length===0,z=G[b??`updated`];function B(e){_(t=>t.filter(t=>t.id!==e))}function be(){C(!1),M()}return(0,I.jsxs)(I.Fragment,{children:[(0,I.jsx)(ee,{"aria-hidden":`true`,"data-testid":`accounts-page-background`,sx:_e}),(0,I.jsxs)(ge,{maxWidth:`xs`,sx:H,children:[(0,I.jsxs)(c,{spacing:1.35,children:[(0,I.jsxs)(c,{spacing:.4,children:[(0,I.jsxs)(c,{direction:`row`,spacing:.75,sx:{alignItems:`center`},children:[(0,I.jsx)(ce,{"aria-label":`返回`,component:re,href:te.settings,sx:V,children:(0,I.jsx)(he,{})}),(0,I.jsx)(d,{component:`h1`,sx:{flex:1,fontSize:{xs:24,sm:26},fontWeight:900},children:`账户管理`}),r?(0,I.jsx)(pe,{onClick:()=>h(!0),sx:W,children:`新增账户`}):null]}),(0,I.jsx)(d,{color:`text.secondary`,variant:`body2`,sx:{pl:5.75},children:`整理家里的现金、银行卡、电子钱包和信用卡`})]}),(0,I.jsx)(fe,{accounts:e,baseCurrency:n}),(0,I.jsxs)(c,{direction:`row`,spacing:.7,sx:U,children:[(0,I.jsx)(F,{label:`全部`,selected:p===`all`,onClick:()=>m(`all`)}),ae.filter(e=>e.value!==`other`).map(e=>(0,I.jsx)(F,{label:e.label,selected:p===e.value,onClick:()=>m(e.value)},e.value))]}),(0,I.jsx)(ue,{accounts:N,archiveAccountAction:A,canManageAccounts:r,emptyDescription:P?`请切换其他账户类型。`:r?void 0:`当前账本还没有可查看的账户。`,emptyTitle:P?`该类型下还没有账户`:void 0,holderOptions:l,placeholderHolderOptions:u,saveResult:f,updateAccountAction:O})]}),i?(0,I.jsx)(me,{}):null,r?(0,I.jsx)(j,{createAccountAction:E,defaultCurrency:n,holderOptions:l,onClose:()=>h(!1),placeholderHolderOptions:u,open:ie}):null,g.map((e,t)=>(0,I.jsx)(se,{aboveModal:!0,bottomOffset:ye(t),description:e.message,onClose:()=>B(e.id),open:!0,title:`账户操作失败`},e.id)),(0,I.jsx)(oe,{bottomOffset:le.feedbackBottomOffset,description:z.description,onClose:be,open:S,title:z.title})]})]})}function F({label:e,onClick:t,selected:n}){return(0,I.jsx)(o,{clickable:!0,color:n?`warning`:`default`,label:e,onClick:t,sx:[{fontWeight:800},n?B:z],variant:n?`filled`:`outlined`})}function ye(e){return`calc(${le.feedbackBottomOffset} + ${e*88}px)`}var I,L,R,z,B,V,H,U,W,G,be=t((()=>{I=r(),D(),u(),s(),_(),l(),f(),ie(),L=e(n()),T(),ne(),g(),N(),w(),de(),v(),E(),O(),k(),A(),i(),h(),R={},z={"@media (hover: hover)":{"&&.MuiChip-clickable:hover":{bgcolor:`action.hover`}},"@media (hover: none)":{"&&.MuiChip-clickable":{bgcolor:`transparent`}}},B={"@media (hover: hover)":{"&&.MuiChip-clickable:hover":{bgcolor:`warning.main`}},"@media (hover: none)":{"&&.MuiChip-clickable":{bgcolor:`warning.main`}}},V={color:`text.primary`,mt:.2},H={px:{xs:.75},py:{xs:.75}},U={flexWrap:`nowrap`,mx:-.5,overflowX:`auto`,px:.5,scrollbarWidth:`none`,"&::-webkit-scrollbar":{display:`none`}},W={borderRadius:`${a.radius.full}px`,flexShrink:0,fontWeight:800,minHeight:40,px:2,whiteSpace:`nowrap`},G={archived:{description:`账户已删除，历史记录不会被删除。`,title:`删除成功`},created:{description:`账户已创建。`,title:`新增成功`},updated:{description:`账户修改已保存。`,title:`保存成功`}},P.__docgenInfo={description:``,methods:[],displayName:`AccountsTemplate`,props:{accounts:{required:!0,tsType:{name:`Array`,elements:[{name:`Account`}],raw:`Account[]`},description:``},archiveAccountAction:{required:!0,tsType:{name:`AccountStateAction`},description:``},baseCurrency:{required:!0,tsType:{name:`string`},description:``},canManageAccounts:{required:!1,tsType:{name:`boolean`},description:``,defaultValue:{value:`true`,computed:!1}},canWriteTransactions:{required:!1,tsType:{name:`boolean`},description:``,defaultValue:{value:`true`,computed:!1}},createAccountAction:{required:!0,tsType:{name:`AccountStateAction`},description:``},initialErrorKey:{required:!1,tsType:{name:`union`,raw:`string | null`,elements:[{name:`string`},{name:`null`}]},description:``,defaultValue:{value:`null`,computed:!1}},initialErrorMessage:{required:!1,tsType:{name:`union`,raw:`string | null`,elements:[{name:`string`},{name:`null`}]},description:``,defaultValue:{value:`null`,computed:!1}},holderOptions:{required:!0,tsType:{name:`Array`,elements:[{name:`AccountHolderOption`}],raw:`AccountHolderOption[]`},description:``},ledgerName:{required:!0,tsType:{name:`string`},description:``},placeholderHolderOptions:{required:!1,tsType:{name:`Array`,elements:[{name:`AccountPlaceholderHolderOption`}],raw:`AccountPlaceholderHolderOption[]`},description:``,defaultValue:{value:`[]`,computed:!1}},saveResult:{required:!1,tsType:{name:`union`,raw:`AccountSaveResult | null`,elements:[{name:`union`,raw:`"archived" | "created" | "updated"`,elements:[{name:`literal`,value:`"archived"`},{name:`literal`,value:`"created"`},{name:`literal`,value:`"updated"`}]},{name:`null`}]},description:``,defaultValue:{value:`null`,computed:!1}},updateAccountAction:{required:!0,tsType:{name:`AccountStateAction`},description:``}}}})),K,xe,q,J,Y,X,Z,Q,$,Se;t((()=>{K=r(),p(),be(),xe={title:`Templates/Accounts/AccountsTemplate`,component:P,decorators:[e=>(0,K.jsx)(m,{storageScope:`storybook-accounts-template`,children:(0,K.jsx)(e,{})})],args:{accounts:[{id:`00000000-0000-4000-8000-000000000001`,name:`三菱UFJ银行`,type:`bank`,currency:`JPY`,initial_balance:1e5,current_balance:85e3,sort_order:1,created_at:`2026-01-01T00:00:00.000Z`,holders:[{id:`holder-1`,user_id:`user-1`,kind:`member`,placeholder_id:null,display_name:`本地开发用户`,email:`local1@example.test`,display_color:`sky`,role:`owner`,share_ratio:null}]},{id:`00000000-0000-4000-8000-000000000002`,name:`PayPay`,type:`e_money`,currency:`JPY`,initial_balance:0,current_balance:3200,sort_order:2,created_at:`2026-01-02T00:00:00.000Z`,holders:[]}],archiveAccountAction:async()=>({}),baseCurrency:`JPY`,createAccountAction:async()=>({}),holderOptions:[{user_id:`user-1`,display_name:`本地开发用户`,email:`local1@example.test`}],ledgerName:`家庭账本`,updateAccountAction:async()=>({})}},q={name:`账户页面`},J={name:`无账户`,args:{accounts:[]}},Y={name:`错误反馈弹窗`,args:{initialErrorKey:`story-error-key-1`,initialErrorMessage:`账户新增失败。请确认账户名称是否重复，或稍后重试。`}},X={name:`保存成功反馈`,args:{saveResult:`updated`}},Z={name:`新增成功反馈`,args:{saveResult:`created`}},Q={name:`删除成功反馈`,args:{saveResult:`archived`}},$={name:`多持有人多账户`,args:{holderOptions:[{user_id:`user-1`,display_name:`本地开发用户`,email:`local1@example.test`},{user_id:`user-2`,display_name:`本地开发用户2`,email:`local2@example.test`}],accounts:[{id:`00000000-0000-4000-8000-000000000001`,name:`三菱UFJ银行`,type:`bank`,currency:`JPY`,initial_balance:1e5,current_balance:85e3,sort_order:1,created_at:`2026-01-01T00:00:00.000Z`,holders:[{id:`holder-1`,user_id:`user-1`,kind:`member`,placeholder_id:null,display_name:`本地开发用户`,email:`local1@example.test`,display_color:`sky`,role:`co_owner`,share_ratio:null},{id:`holder-2`,user_id:`user-2`,kind:`member`,placeholder_id:null,display_name:`本地开发用户2`,email:`local2@example.test`,display_color:`sakura`,role:`co_owner`,share_ratio:null}]},{id:`00000000-0000-4000-8000-000000000002`,name:`楽天カード`,type:`credit_card`,currency:`JPY`,initial_balance:0,current_balance:-12500,sort_order:2,created_at:`2026-01-02T00:00:00.000Z`,holders:[{id:`holder-3`,user_id:`user-2`,kind:`member`,placeholder_id:null,display_name:`本地开发用户2`,email:`local2@example.test`,display_color:`sakura`,role:`owner`,share_ratio:null}]},{id:`00000000-0000-4000-8000-000000000003`,name:`PayPay`,type:`e_money`,currency:`JPY`,initial_balance:0,current_balance:3200,sort_order:3,created_at:`2026-01-03T00:00:00.000Z`,holders:[]}]}},q.parameters={...q.parameters,docs:{...q.parameters?.docs,source:{originalSource:`{
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
        kind: "member" as const,
        placeholder_id: null,
        display_name: "本地开发用户",
        email: "local1@example.test",
        display_color: "sky",
        role: "co_owner",
        share_ratio: null
      }, {
        id: "holder-2",
        user_id: "user-2",
        kind: "member" as const,
        placeholder_id: null,
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
        kind: "member" as const,
        placeholder_id: null,
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
}`,...$.parameters?.docs?.source}}},Se=[`Default`,`Empty`,`WithError`,`SaveSucceeded`,`CreateSucceeded`,`ArchiveSucceeded`,`MultipleHolders`]}))();export{Q as ArchiveSucceeded,Z as CreateSucceeded,q as Default,J as Empty,$ as MultipleHolders,X as SaveSucceeded,Y as WithError,Se as __namedExportsOrder,xe as default};