import{c as e,i as t}from"./preload-helper-D2yxXLVK.js";import{t as n}from"./react-DAMDAfNa.js";import{t as r}from"./jsx-runtime-Dwpk6tgA.js";import{n as i,t as a}from"./iframe-uxNjHvAg.js";import{n as o,t as s}from"./Chip-DcyRJ30y.js";import{n as c,t as l}from"./Stack-DRbcmy6F.js";import{n as ee,t as u}from"./Box-CaWOaN2H.js";import{n as d,t as f}from"./Typography-CwLqrFKa.js";import{a as te,n as ne}from"./paths-t1fEWS--.js";import{n as p,t as m}from"./UserThemeProvider-siQIya_f.js";import{n as re,t as ie}from"./link-Du4AGLbo.js";import{a as ae}from"./account-DeUkA5tX.js";import{a as h}from"./accounts-ama5jf5a.js";import{i as oe,o as se,s as g}from"./OperationFeedbackDialogs-B6wbtf_A.js";import{n as ce,t as _}from"./IconButton-DgEIThjY.js";import{n as v,r as le,t as ue}from"./bottomNavigationLayout-C2BMCrAg.js";import{n as y,t as de}from"./AccountForm-CO1Igu8P.js";import{n as b,r as x,t as S}from"./AccountFormDialogShell-DlPIRos1.js";import{n as C,t as fe}from"./AccountList-BYg_6HA1.js";import{n as w,t as pe}from"./AccountSummaryCard-OYjJ7AxY.js";import{n as T,t as me}from"./CreateButton-9ztwIaqX.js";import{n as he,t as E}from"./useClearQueryParam-C6uPCiYQ.js";import{n as D,t as ge}from"./TransactionAmountKeypadLauncher-DyQ-ePp-.js";import{n as O,t as _e}from"./ArrowBackRounded-CxlZpNyn.js";import{n as k,t as ve}from"./PageShell-BG48udbm.js";import{n as A,t as ye}from"./fullViewportPageBackgroundSx-BEsR-Htf.js";function be({createAccountAction:e,defaultCurrency:t,holderOptions:n,onClose:r,open:i,placeholderHolderOptions:a=[]}){return(0,j.jsx)(b,{illustrationSlot:(0,j.jsx)(S,{}),onClose:r,open:i,children:(0,j.jsx)(de,{createAccountAction:e,defaultCurrency:t,holderOptions:n,onCancel:r,placeholderHolderOptions:a})})}var j,M=t((()=>{j=r(),y(),x(),be.__docgenInfo={description:``,methods:[],displayName:`AccountCreateDialog`,props:{createAccountAction:{required:!0,tsType:{name:`ServerAction`},description:``},defaultCurrency:{required:!0,tsType:{name:`string`},description:``},holderOptions:{required:!0,tsType:{name:`Array`,elements:[{name:`AccountHolderOption`}],raw:`AccountHolderOption[]`},description:``},onClose:{required:!0,tsType:{name:`signature`,type:`function`,raw:`() => void`,signature:{arguments:[],return:{name:`void`}}},description:``},open:{required:!0,tsType:{name:`boolean`},description:``},placeholderHolderOptions:{required:!1,tsType:{name:`Array`,elements:[{name:`AccountPlaceholderHolderOption`}],raw:`AccountPlaceholderHolderOption[]`},description:``,defaultValue:{value:`[]`,computed:!1}}}}}));function N({accounts:e,archiveAccountAction:t,baseCurrency:n,canManageAccounts:r=!0,canWriteTransactions:i=!0,createAccountAction:a,initialErrorKey:o=null,initialErrorMessage:s=null,holderOptions:l,placeholderHolderOptions:u=[],saveResult:f=null,updateAccountAction:ne}){let[p,m]=(0,I.useState)(`all`),[ie,h]=(0,I.useState)(!1),[g,_]=(0,I.useState)([]),v=(0,I.useRef)(0),y=(0,I.useRef)(new Set),[de,b]=(0,I.useState)(f),[x,S]=(0,I.useState)(f!==null),[C,w]=(0,I.useState)(f),[T,E]=(0,I.useActionState)(a,L),[D,O]=(0,I.useActionState)(ne,L),[k,A]=(0,I.useActionState)(t,L),j=he(`result`);(0,I.useEffect)(()=>{let e=[{error:s??void 0,errorKey:o??void 0},T,D,k];for(let t of e){if(!t.error||!t.errorKey||y.current.has(t.errorKey))continue;y.current.add(t.errorKey),v.current+=1;let e=`${t.errorKey}-${v.current}`;_(n=>[...n,{id:e,message:t.error}])}},[k,T,o,s,D]),f!==C&&(w(f),f!==null&&(b(f),S(!0),h(!1)));let M=(0,I.useMemo)(()=>p===`all`?e:e.filter(e=>e.type===p),[e,p]),N=p!==`all`&&M.length===0,R=W[de??`updated`];function z(e){_(t=>t.filter(t=>t.id!==e))}function G(){S(!1),j()}return(0,F.jsxs)(F.Fragment,{children:[(0,F.jsx)(ee,{"aria-hidden":`true`,"data-testid":`accounts-page-background`,sx:ye}),(0,F.jsxs)(ve,{maxWidth:`xs`,sx:V,children:[(0,F.jsxs)(c,{spacing:1.35,children:[(0,F.jsxs)(c,{spacing:.4,children:[(0,F.jsxs)(c,{direction:`row`,spacing:.75,sx:{alignItems:`center`},children:[(0,F.jsx)(ce,{"aria-label":`返回`,component:re,href:te.settings,sx:B,children:(0,F.jsx)(_e,{})}),(0,F.jsx)(d,{component:`h1`,sx:{flex:1,fontSize:{xs:24,sm:26},fontWeight:900},children:`账户管理`}),r?(0,F.jsx)(me,{onClick:()=>h(!0),sx:U,children:`新增账户`}):null]}),(0,F.jsx)(d,{color:`text.secondary`,variant:`body2`,sx:{pl:5.75},children:`整理家里的现金、银行卡、电子钱包和信用卡`})]}),(0,F.jsx)(pe,{accounts:e,baseCurrency:n}),(0,F.jsxs)(c,{direction:`row`,spacing:.7,sx:H,children:[(0,F.jsx)(P,{label:`全部`,selected:p===`all`,onClick:()=>m(`all`)}),ae.filter(e=>e.value!==`other`).map(e=>(0,F.jsx)(P,{label:e.label,selected:p===e.value,onClick:()=>m(e.value)},e.value))]}),(0,F.jsx)(fe,{accounts:M,archiveAccountAction:A,canManageAccounts:r,emptyDescription:N?`请切换其他账户类型。`:r?void 0:`当前账本还没有可查看的账户。`,emptyTitle:N?`该类型下还没有账户`:void 0,holderOptions:l,placeholderHolderOptions:u,saveResult:f,updateAccountAction:O})]}),i?(0,F.jsx)(ge,{}):null,r?(0,F.jsx)(be,{createAccountAction:E,defaultCurrency:n,holderOptions:l,onClose:()=>h(!1),placeholderHolderOptions:u,open:ie}):null,g.map((e,t)=>(0,F.jsx)(oe,{aboveModal:!0,bottomOffset:le(t),description:e.message,onClose:()=>z(e.id),open:!0,title:`账户操作失败`},e.id)),(0,F.jsx)(se,{bottomOffset:ue.feedbackBottomOffset,description:R.description,onClose:G,open:x,title:R.title})]})]})}function P({label:e,onClick:t,selected:n}){return(0,F.jsx)(o,{clickable:!0,color:n?`warning`:`default`,label:e,onClick:t,sx:[{fontWeight:800},n?z:R],variant:n?`filled`:`outlined`})}var F,I,L,R,z,B,V,H,U,W,G=t((()=>{F=r(),O(),u(),s(),_(),l(),f(),ie(),I=e(n()),T(),ne(),g(),M(),C(),w(),v(),D(),k(),A(),E(),i(),h(),L={},R={"@media (hover: hover)":{"&&.MuiChip-clickable:hover":{bgcolor:`action.hover`}},"@media (hover: none)":{"&&.MuiChip-clickable":{bgcolor:`transparent`}}},z={"@media (hover: hover)":{"&&.MuiChip-clickable:hover":{bgcolor:`warning.main`}},"@media (hover: none)":{"&&.MuiChip-clickable":{bgcolor:`warning.main`}}},B={color:`text.primary`,mt:.2},V={px:{xs:.75},py:{xs:.75}},H={flexWrap:`nowrap`,mx:-.5,overflowX:`auto`,px:.5,scrollbarWidth:`none`,"&::-webkit-scrollbar":{display:`none`}},U={borderRadius:`${a.radius.full}px`,flexShrink:0,fontWeight:800,minHeight:40,px:2,whiteSpace:`nowrap`},W={archived:{description:`账户已删除，历史记录不会被删除。`,title:`删除成功`},created:{description:`账户已创建。`,title:`新增成功`},updated:{description:`账户修改已保存。`,title:`保存成功`}},N.__docgenInfo={description:``,methods:[],displayName:`AccountsTemplate`,props:{accounts:{required:!0,tsType:{name:`Array`,elements:[{name:`Account`}],raw:`Account[]`},description:``},archiveAccountAction:{required:!0,tsType:{name:`AccountStateAction`},description:``},baseCurrency:{required:!0,tsType:{name:`string`},description:``},canManageAccounts:{required:!1,tsType:{name:`boolean`},description:``,defaultValue:{value:`true`,computed:!1}},canWriteTransactions:{required:!1,tsType:{name:`boolean`},description:``,defaultValue:{value:`true`,computed:!1}},createAccountAction:{required:!0,tsType:{name:`AccountStateAction`},description:``},initialErrorKey:{required:!1,tsType:{name:`union`,raw:`string | null`,elements:[{name:`string`},{name:`null`}]},description:``,defaultValue:{value:`null`,computed:!1}},initialErrorMessage:{required:!1,tsType:{name:`union`,raw:`string | null`,elements:[{name:`string`},{name:`null`}]},description:``,defaultValue:{value:`null`,computed:!1}},holderOptions:{required:!0,tsType:{name:`Array`,elements:[{name:`AccountHolderOption`}],raw:`AccountHolderOption[]`},description:``},ledgerName:{required:!0,tsType:{name:`string`},description:``},placeholderHolderOptions:{required:!1,tsType:{name:`Array`,elements:[{name:`AccountPlaceholderHolderOption`}],raw:`AccountPlaceholderHolderOption[]`},description:``,defaultValue:{value:`[]`,computed:!1}},saveResult:{required:!1,tsType:{name:`union`,raw:`AccountSaveResult | null`,elements:[{name:`union`,raw:`"archived" | "created" | "updated"`,elements:[{name:`literal`,value:`"archived"`},{name:`literal`,value:`"created"`},{name:`literal`,value:`"updated"`}]},{name:`null`}]},description:``,defaultValue:{value:`null`,computed:!1}},updateAccountAction:{required:!0,tsType:{name:`AccountStateAction`},description:``}}}})),K,xe,q,J,Y,X,Z,Q,$,Se;t((()=>{K=r(),p(),G(),xe={title:`Templates/Accounts/AccountsTemplate`,component:N,decorators:[e=>(0,K.jsx)(m,{storageScope:`storybook-accounts-template`,children:(0,K.jsx)(e,{})})],args:{accounts:[{id:`00000000-0000-4000-8000-000000000001`,name:`三菱UFJ银行`,type:`bank`,currency:`JPY`,initial_balance:1e5,current_balance:85e3,sort_order:1,created_at:`2026-01-01T00:00:00.000Z`,holders:[{id:`holder-1`,user_id:`user-1`,kind:`member`,placeholder_id:null,display_name:`本地开发用户`,email:`local1@example.test`,display_color:`sky`,role:`owner`,share_ratio:null}]},{id:`00000000-0000-4000-8000-000000000002`,name:`PayPay`,type:`e_money`,currency:`JPY`,initial_balance:0,current_balance:3200,sort_order:2,created_at:`2026-01-02T00:00:00.000Z`,holders:[]}],archiveAccountAction:async()=>({}),baseCurrency:`JPY`,createAccountAction:async()=>({}),holderOptions:[{user_id:`user-1`,display_name:`本地开发用户`,email:`local1@example.test`}],ledgerName:`家庭账本`,updateAccountAction:async()=>({})}},q={name:`账户页面`},J={name:`无账户`,args:{accounts:[]}},Y={name:`错误反馈弹窗`,args:{initialErrorKey:`story-error-key-1`,initialErrorMessage:`账户新增失败。请确认账户名称是否重复，或稍后重试。`}},X={name:`保存成功反馈`,args:{saveResult:`updated`}},Z={name:`新增成功反馈`,args:{saveResult:`created`}},Q={name:`删除成功反馈`,args:{saveResult:`archived`}},$={name:`多持有人多账户`,args:{holderOptions:[{user_id:`user-1`,display_name:`本地开发用户`,email:`local1@example.test`},{user_id:`user-2`,display_name:`本地开发用户2`,email:`local2@example.test`}],accounts:[{id:`00000000-0000-4000-8000-000000000001`,name:`三菱UFJ银行`,type:`bank`,currency:`JPY`,initial_balance:1e5,current_balance:85e3,sort_order:1,created_at:`2026-01-01T00:00:00.000Z`,holders:[{id:`holder-1`,user_id:`user-1`,kind:`member`,placeholder_id:null,display_name:`本地开发用户`,email:`local1@example.test`,display_color:`sky`,role:`co_owner`,share_ratio:null},{id:`holder-2`,user_id:`user-2`,kind:`member`,placeholder_id:null,display_name:`本地开发用户2`,email:`local2@example.test`,display_color:`sakura`,role:`co_owner`,share_ratio:null}]},{id:`00000000-0000-4000-8000-000000000002`,name:`楽天カード`,type:`credit_card`,currency:`JPY`,initial_balance:0,current_balance:-12500,sort_order:2,created_at:`2026-01-02T00:00:00.000Z`,holders:[{id:`holder-3`,user_id:`user-2`,kind:`member`,placeholder_id:null,display_name:`本地开发用户2`,email:`local2@example.test`,display_color:`sakura`,role:`owner`,share_ratio:null}]},{id:`00000000-0000-4000-8000-000000000003`,name:`PayPay`,type:`e_money`,currency:`JPY`,initial_balance:0,current_balance:3200,sort_order:3,created_at:`2026-01-03T00:00:00.000Z`,holders:[]}]}},q.parameters={...q.parameters,docs:{...q.parameters?.docs,source:{originalSource:`{
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