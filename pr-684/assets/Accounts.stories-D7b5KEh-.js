import{c as e,i as t}from"./preload-helper-D2yxXLVK.js";import{t as n}from"./react-DAMDAfNa.js";import{t as r}from"./jsx-runtime-Dwpk6tgA.js";import{F as ee,N as i,n as a,t as o}from"./iframe-CcLu1DPB.js";import{n as s,t as c}from"./Chip-Dk_3-59y.js";import{n as l,t as u}from"./Stack-DRbcmy6F.js";import{n as te,t as ne}from"./Box-D-GhTrxh.js";import{n as d,t as f}from"./Typography-CwLqrFKa.js";import{a as re,n as p}from"./paths-B1Daueo6.js";import{n as ie,t as m}from"./UserThemeProvider-BJ5GJJYG.js";import{n as ae,t as oe}from"./link-Du4AGLbo.js";import{a as se,o as h}from"./accounts-DpbEXm7k.js";import{a as ce,i as le,o as g}from"./OperationFeedbackDialogs-CCbcfJ3v.js";import{n as ue,t as _}from"./IconButton-BvjujjMV.js";import{n as v,t as y}from"./AccountForm-BIAd6LA-.js";import{n as b,r as x,t as S}from"./AccountFormDialogShell-DFlTSqf7.js";import{n as de,t as fe}from"./AccountList-BZLJ6Kaz.js";import{n as C,t as pe}from"./AccountSummaryCard-CSJYJb83.js";import{n as w,t as T}from"./bottomNavigationLayout-CCZmOE5k.js";import{n as E,t as me}from"./TransactionAmountKeypadLauncher-BIzR98gQ.js";import{n as D,t as he}from"./ArrowBackRounded-CxlZpNyn.js";import{n as O,t as ge}from"./CreateButton-B4L8BUPV.js";import{n as k,t as _e}from"./PageShell-CurbQrD7.js";import{n as A,t as ve}from"./fullViewportPageBackgroundSx-BEsR-Htf.js";function j({createAccountAction:e,defaultCurrency:t,holderOptions:n,onClose:r,open:ee}){return(0,M.jsx)(b,{illustrationSlot:(0,M.jsx)(S,{}),onClose:r,open:ee,children:(0,M.jsx)(y,{createAccountAction:e,defaultCurrency:t,holderOptions:n,onCancel:r})})}var M,N=t((()=>{M=r(),v(),x(),j.__docgenInfo={description:``,methods:[],displayName:`AccountCreateDialog`,props:{createAccountAction:{required:!0,tsType:{name:`ServerAction`},description:``},defaultCurrency:{required:!0,tsType:{name:`string`},description:``},holderOptions:{required:!0,tsType:{name:`Array`,elements:[{name:`AccountHolderOption`}],raw:`AccountHolderOption[]`},description:``},onClose:{required:!0,tsType:{name:`signature`,type:`function`,raw:`() => void`,signature:{arguments:[],return:{name:`void`}}},description:``},open:{required:!0,tsType:{name:`boolean`},description:``}}}}));function P({accounts:e,archiveAccountAction:t,baseCurrency:n,canManageAccounts:r=!0,canWriteTransactions:i=!0,createAccountAction:a,initialErrorKey:o=null,initialErrorMessage:s=null,holderOptions:c,saveResult:u=null,updateAccountAction:ne}){let[f,p]=(0,L.useState)(`all`),[ie,m]=(0,L.useState)(!1),[oe,h]=(0,L.useState)([]),g=(0,L.useRef)(0),_=(0,L.useRef)(new Set),[v,y]=(0,L.useState)(u),[b,x]=(0,L.useState)(u!==null),[S,de]=(0,L.useState)(u),[C,w]=(0,L.useActionState)(a,R),[T,E]=(0,L.useActionState)(ne,R),[D,O]=(0,L.useActionState)(t,R),k=ee();(0,L.useEffect)(()=>{let e=[{error:s??void 0,errorKey:o??void 0},C,T,D];for(let t of e){if(!t.error||!t.errorKey||_.current.has(t.errorKey))continue;_.current.add(t.errorKey),g.current+=1;let e=`${t.errorKey}-${g.current}`;h(n=>[...n,{id:e,message:t.error}])}},[D,C,o,s,T]),u!==S&&(de(u),u!==null&&(y(u),x(!0),m(!1)));let A=(0,L.useMemo)(()=>f===`all`?e:e.filter(e=>e.type===f),[e,f]),M=f!==`all`&&A.length===0,N=W[v??`updated`];function P(e){h(t=>t.filter(t=>t.id!==e))}function be(){x(!1);let e=new URL(window.location.href);e.searchParams.delete(`result`),k.replace(`${e.pathname}${e.search}${e.hash}`,{scroll:!1})}return(0,I.jsxs)(I.Fragment,{children:[(0,I.jsx)(te,{"aria-hidden":`true`,"data-testid":`accounts-page-background`,sx:ve}),(0,I.jsxs)(_e,{maxWidth:`xs`,sx:B,children:[(0,I.jsxs)(l,{spacing:1.35,children:[(0,I.jsxs)(l,{spacing:.4,children:[(0,I.jsxs)(l,{direction:`row`,spacing:.75,sx:{alignItems:`center`},children:[(0,I.jsx)(ue,{"aria-label":`返回`,component:ae,href:re.settings,sx:z,children:(0,I.jsx)(he,{})}),(0,I.jsx)(d,{component:`h1`,sx:{flex:1,fontSize:{xs:24,sm:26},fontWeight:900},children:`账户管理`}),r?(0,I.jsx)(ge,{onClick:()=>m(!0),sx:H,children:`新增账户`}):null]}),(0,I.jsx)(d,{color:`text.secondary`,variant:`body2`,sx:{pl:5.75},children:`整理家里的现金、银行卡、电子钱包和信用卡`})]}),(0,I.jsx)(pe,{accounts:e,baseCurrency:n}),(0,I.jsxs)(l,{direction:`row`,spacing:.7,sx:V,children:[(0,I.jsx)(F,{label:`全部`,selected:f===`all`,onClick:()=>p(`all`)}),se.filter(e=>e.value!==`other`).map(e=>(0,I.jsx)(F,{label:e.label,selected:f===e.value,onClick:()=>p(e.value)},e.value))]}),(0,I.jsx)(fe,{accounts:A,archiveAccountAction:O,canManageAccounts:r,emptyDescription:M?`请切换其他账户类型。`:r?void 0:`当前账本还没有可查看的账户。`,emptyTitle:M?`该类型下还没有账户`:void 0,holderOptions:c,saveResult:u,updateAccountAction:E})]}),i?(0,I.jsx)(me,{}):null,r?(0,I.jsx)(j,{createAccountAction:w,defaultCurrency:n,holderOptions:c,onClose:()=>m(!1),open:ie}):null,oe.map((e,t)=>(0,I.jsx)(le,{bottomOffset:ye(t),description:e.message,onClose:()=>P(e.id),open:!0,title:`账户操作失败`},e.id)),(0,I.jsx)(ce,{bottomOffset:U,description:N.description,onClose:be,open:b,title:N.title})]})]})}function F({label:e,onClick:t,selected:n}){return(0,I.jsx)(s,{clickable:!0,color:n?`warning`:`default`,label:e,onClick:t,sx:{fontWeight:800},variant:n?`filled`:`outlined`})}function ye(e){return`calc(${U} + ${e*88}px)`}var I,L,R,z,B,V,H,U,W,be=t((()=>{I=r(),D(),ne(),c(),_(),u(),f(),oe(),i(),L=e(n()),O(),p(),g(),N(),de(),C(),w(),E(),k(),A(),a(),h(),R={},z={color:`text.primary`,mt:.2},B={px:{xs:.75},py:{xs:.75}},V={flexWrap:`nowrap`,mx:-.5,overflowX:`auto`,px:.5,scrollbarWidth:`none`,"&::-webkit-scrollbar":{display:`none`}},H={borderRadius:`${o.radius.full}px`,flexShrink:0,fontWeight:800,minHeight:40,px:2,whiteSpace:`nowrap`},U=`calc(${T.shellPaddingBottom} + 8px)`,W={archived:{description:`账户已删除，历史记录不会被删除。`,title:`删除成功`},created:{description:`账户已创建。`,title:`新增成功`},updated:{description:`账户修改已保存。`,title:`保存成功`}},P.__docgenInfo={description:``,methods:[],displayName:`AccountsTemplate`,props:{accounts:{required:!0,tsType:{name:`Array`,elements:[{name:`Account`}],raw:`Account[]`},description:``},archiveAccountAction:{required:!0,tsType:{name:`AccountStateAction`},description:``},baseCurrency:{required:!0,tsType:{name:`string`},description:``},canManageAccounts:{required:!1,tsType:{name:`boolean`},description:``,defaultValue:{value:`true`,computed:!1}},canWriteTransactions:{required:!1,tsType:{name:`boolean`},description:``,defaultValue:{value:`true`,computed:!1}},createAccountAction:{required:!0,tsType:{name:`AccountStateAction`},description:``},initialErrorKey:{required:!1,tsType:{name:`union`,raw:`string | null`,elements:[{name:`string`},{name:`null`}]},description:``,defaultValue:{value:`null`,computed:!1}},initialErrorMessage:{required:!1,tsType:{name:`union`,raw:`string | null`,elements:[{name:`string`},{name:`null`}]},description:``,defaultValue:{value:`null`,computed:!1}},holderOptions:{required:!0,tsType:{name:`Array`,elements:[{name:`AccountHolderOption`}],raw:`AccountHolderOption[]`},description:``},ledgerName:{required:!0,tsType:{name:`string`},description:``},saveResult:{required:!1,tsType:{name:`union`,raw:`AccountSaveResult | null`,elements:[{name:`union`,raw:`"archived" | "created" | "updated"`,elements:[{name:`literal`,value:`"archived"`},{name:`literal`,value:`"created"`},{name:`literal`,value:`"updated"`}]},{name:`null`}]},description:``,defaultValue:{value:`null`,computed:!1}},updateAccountAction:{required:!0,tsType:{name:`AccountStateAction`},description:``}}}})),G,xe,K,q,J,Y,X,Z,Q,$;t((()=>{G=r(),ie(),be(),xe={title:`Templates/Accounts/AccountsTemplate`,component:P,decorators:[e=>(0,G.jsx)(m,{storageScope:`storybook-accounts-template`,children:(0,G.jsx)(e,{})})],args:{accounts:[{id:`00000000-0000-4000-8000-000000000001`,name:`三菱UFJ银行`,type:`bank`,currency:`JPY`,initial_balance:1e5,current_balance:85e3,sort_order:1,created_at:`2026-01-01T00:00:00.000Z`,holders:[{id:`holder-1`,user_id:`user-1`,display_name:`本地开发用户`,email:`local1@example.test`,display_color:`sky`,role:`owner`,share_ratio:null}]},{id:`00000000-0000-4000-8000-000000000002`,name:`PayPay`,type:`e_money`,currency:`JPY`,initial_balance:0,current_balance:3200,sort_order:2,created_at:`2026-01-02T00:00:00.000Z`,holders:[]}],archiveAccountAction:async()=>({}),baseCurrency:`JPY`,createAccountAction:async()=>({}),holderOptions:[{user_id:`user-1`,display_name:`本地开发用户`,email:`local1@example.test`}],ledgerName:`家庭账本`,updateAccountAction:async()=>({})}},K={name:`账户页面`},q={name:`无账户`,args:{accounts:[]}},J={name:`错误反馈弹窗`,args:{initialErrorKey:`story-error-key-1`,initialErrorMessage:`账户新增失败。请确认账户名称是否重复，或稍后重试。`}},Y={name:`保存成功反馈`,args:{saveResult:`updated`}},X={name:`新增成功反馈`,args:{saveResult:`created`}},Z={name:`删除成功反馈`,args:{saveResult:`archived`}},Q={name:`多持有人多账户`,args:{holderOptions:[{user_id:`user-1`,display_name:`本地开发用户`,email:`local1@example.test`},{user_id:`user-2`,display_name:`本地开发用户2`,email:`local2@example.test`}],accounts:[{id:`00000000-0000-4000-8000-000000000001`,name:`三菱UFJ银行`,type:`bank`,currency:`JPY`,initial_balance:1e5,current_balance:85e3,sort_order:1,created_at:`2026-01-01T00:00:00.000Z`,holders:[{id:`holder-1`,user_id:`user-1`,display_name:`本地开发用户`,email:`local1@example.test`,display_color:`sky`,role:`co_owner`,share_ratio:null},{id:`holder-2`,user_id:`user-2`,display_name:`本地开发用户2`,email:`local2@example.test`,display_color:`sakura`,role:`co_owner`,share_ratio:null}]},{id:`00000000-0000-4000-8000-000000000002`,name:`楽天カード`,type:`credit_card`,currency:`JPY`,initial_balance:0,current_balance:-12500,sort_order:2,created_at:`2026-01-02T00:00:00.000Z`,holders:[{id:`holder-3`,user_id:`user-2`,display_name:`本地开发用户2`,email:`local2@example.test`,display_color:`sakura`,role:`owner`,share_ratio:null}]},{id:`00000000-0000-4000-8000-000000000003`,name:`PayPay`,type:`e_money`,currency:`JPY`,initial_balance:0,current_balance:3200,sort_order:3,created_at:`2026-01-03T00:00:00.000Z`,holders:[]}]}},K.parameters={...K.parameters,docs:{...K.parameters?.docs,source:{originalSource:`{
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
}`,...Q.parameters?.docs?.source}}},$=[`Default`,`Empty`,`WithError`,`SaveSucceeded`,`CreateSucceeded`,`ArchiveSucceeded`,`MultipleHolders`]}))();export{Z as ArchiveSucceeded,X as CreateSucceeded,K as Default,q as Empty,Q as MultipleHolders,Y as SaveSucceeded,J as WithError,$ as __namedExportsOrder,xe as default};