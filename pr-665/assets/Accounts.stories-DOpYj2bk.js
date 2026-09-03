import{c as e,i as t}from"./preload-helper-D2yxXLVK.js";import{t as n}from"./react-DAMDAfNa.js";import{t as r}from"./jsx-runtime-Dwpk6tgA.js";import{F as ee,N as te}from"./iframe-BL5c8UDN.js";import{n as i,t as a}from"./Chip-Dk_3-59y.js";import{n as o,t as s}from"./Stack-DRbcmy6F.js";import{n as ne,t as c}from"./Box-BHYjcIbe.js";import{n as l,t as u}from"./Typography-CwLqrFKa.js";import{a as re,n as ie}from"./paths-CQl5VVu_.js";import{n as d,t as f}from"./UserThemeProvider-Bk06dwS0.js";import{n as ae,t as oe}from"./link-Du4AGLbo.js";import{a as se,o as p}from"./accounts-DpbEXm7k.js";import{a as ce,i as le,o as m}from"./OperationFeedbackDialogs-Bm9M1F6v.js";import{n as ue,t as h}from"./IconButton-BvjujjMV.js";import{n as g,t as _}from"./AccountForm-CCTFf-bW.js";import{n as de,r as v,t as y}from"./AccountFormDialogShell-BdoKW8kB.js";import{n as b,t as fe}from"./AccountList-Ckqy6Www.js";import{n as x,t as pe}from"./AccountSummaryCard-Dl6W3fC6.js";import{n as S,t as C}from"./bottomNavigationLayout-Bxto1IsC.js";import{n as w,t as me}from"./TransactionAmountKeypadLauncher-B6h40EW9.js";import{n as T,t as he}from"./ArrowBackRounded-CxlZpNyn.js";import{n as E,t as ge}from"./CreateButton-DMHbYh4v.js";import{n as D,t as _e}from"./PageShell-DmYb7P46.js";import{n as O,t as ve}from"./fullViewportPageBackgroundSx-BEsR-Htf.js";function k({createAccountAction:e,defaultCurrency:t,holderOptions:n,onClose:r,open:ee}){return(0,A.jsx)(de,{illustrationSlot:(0,A.jsx)(y,{}),onClose:r,open:ee,children:(0,A.jsx)(_,{createAccountAction:e,defaultCurrency:t,holderOptions:n,onCancel:r})})}var A,j=t((()=>{A=r(),g(),v(),k.__docgenInfo={description:``,methods:[],displayName:`AccountCreateDialog`,props:{createAccountAction:{required:!0,tsType:{name:`ServerAction`},description:``},defaultCurrency:{required:!0,tsType:{name:`string`},description:``},holderOptions:{required:!0,tsType:{name:`Array`,elements:[{name:`AccountHolderOption`}],raw:`AccountHolderOption[]`},description:``},onClose:{required:!0,tsType:{name:`signature`,type:`function`,raw:`() => void`,signature:{arguments:[],return:{name:`void`}}},description:``},open:{required:!0,tsType:{name:`boolean`},description:``}}}}));function M({accounts:e,archiveAccountAction:t,baseCurrency:n,canManageAccounts:r=!0,canWriteTransactions:te=!0,createAccountAction:i,initialErrorKey:a=null,initialErrorMessage:s=null,holderOptions:c,saveResult:u=null,updateAccountAction:ie}){let[d,f]=(0,F.useState)(`all`),[oe,p]=(0,F.useState)(!1),[m,h]=(0,F.useState)([]),g=(0,F.useRef)(0),_=(0,F.useRef)(new Set),[de,v]=(0,F.useState)(u),[y,b]=(0,F.useState)(u!==null),[x,S]=(0,F.useState)(u),[C,w]=(0,F.useActionState)(i,I),[T,E]=(0,F.useActionState)(ie,I),[D,O]=(0,F.useActionState)(t,I),A=ee();(0,F.useEffect)(()=>{let e=[{error:s??void 0,errorKey:a??void 0},C,T,D];for(let t of e){if(!t.error||!t.errorKey||_.current.has(t.errorKey))continue;_.current.add(t.errorKey),g.current+=1;let e=`${t.errorKey}-${g.current}`;h(n=>[...n,{id:e,message:t.error}])}},[D,C,a,s,T]),u!==x&&(S(u),u!==null&&(v(u),b(!0),p(!1)));let j=(0,F.useMemo)(()=>d===`all`?e:e.filter(e=>e.type===d),[e,d]),M=d!==`all`&&j.length===0,U=H[de??`updated`];function W(e){h(t=>t.filter(t=>t.id!==e))}function G(){b(!1);let e=new URL(window.location.href);e.searchParams.delete(`result`),A.replace(`${e.pathname}${e.search}${e.hash}`,{scroll:!1})}return(0,P.jsxs)(P.Fragment,{children:[(0,P.jsx)(ne,{"aria-hidden":`true`,"data-testid":`accounts-page-background`,sx:ve}),(0,P.jsxs)(_e,{maxWidth:`xs`,sx:R,children:[(0,P.jsxs)(o,{spacing:1.35,children:[(0,P.jsxs)(o,{spacing:.4,children:[(0,P.jsxs)(o,{direction:`row`,spacing:.75,sx:{alignItems:`center`},children:[(0,P.jsx)(ue,{"aria-label":`返回`,component:ae,href:re.settings,sx:L,children:(0,P.jsx)(he,{})}),(0,P.jsx)(l,{component:`h1`,sx:{flex:1,fontSize:{xs:24,sm:26},fontWeight:900},children:`账户管理`}),r?(0,P.jsx)(ge,{onClick:()=>p(!0),sx:B,children:`新增账户`}):null]}),(0,P.jsx)(l,{color:`text.secondary`,variant:`body2`,sx:{pl:5.75},children:`整理家里的现金、银行卡、电子钱包和信用卡`})]}),(0,P.jsx)(pe,{accounts:e,baseCurrency:n}),(0,P.jsxs)(o,{direction:`row`,spacing:.7,sx:z,children:[(0,P.jsx)(N,{label:`全部`,selected:d===`all`,onClick:()=>f(`all`)}),se.filter(e=>e.value!==`other`).map(e=>(0,P.jsx)(N,{label:e.label,selected:d===e.value,onClick:()=>f(e.value)},e.value))]}),(0,P.jsx)(fe,{accounts:j,archiveAccountAction:O,canManageAccounts:r,emptyDescription:M?`请切换其他账户类型。`:r?void 0:`当前账本还没有可查看的账户。`,emptyTitle:M?`该类型下还没有账户`:void 0,holderOptions:c,saveResult:u,updateAccountAction:E})]}),te?(0,P.jsx)(me,{}):null,r?(0,P.jsx)(k,{createAccountAction:w,defaultCurrency:n,holderOptions:c,onClose:()=>p(!1),open:oe}):null,m.map((e,t)=>(0,P.jsx)(le,{bottomOffset:ye(t),description:e.message,onClose:()=>W(e.id),open:!0,title:`账户操作失败`},e.id)),(0,P.jsx)(ce,{bottomOffset:V,description:U.description,onClose:G,open:y,title:U.title})]})]})}function N({label:e,onClick:t,selected:n}){return(0,P.jsx)(i,{clickable:!0,color:n?`warning`:`default`,label:e,onClick:t,sx:{fontWeight:800},variant:n?`filled`:`outlined`})}function ye(e){return`calc(${V} + ${e*88}px)`}var P,F,I,L,R,z,B,V,H,U=t((()=>{P=r(),T(),c(),a(),h(),s(),u(),oe(),te(),F=e(n()),E(),ie(),m(),j(),b(),x(),S(),w(),D(),O(),p(),I={},L={color:`text.primary`,mt:.2},R={px:{xs:.75},py:{xs:.75}},z={flexWrap:`nowrap`,mx:-.5,overflowX:`auto`,px:.5,scrollbarWidth:`none`,"&::-webkit-scrollbar":{display:`none`}},B={borderRadius:999,flexShrink:0,fontWeight:800,minHeight:40,px:2,whiteSpace:`nowrap`},V=`calc(${C.shellPaddingBottom} + 8px)`,H={archived:{description:`账户已删除，历史记录不会被删除。`,title:`删除成功`},created:{description:`账户已创建。`,title:`新增成功`},updated:{description:`账户修改已保存。`,title:`保存成功`}},M.__docgenInfo={description:``,methods:[],displayName:`AccountsTemplate`,props:{accounts:{required:!0,tsType:{name:`Array`,elements:[{name:`Account`}],raw:`Account[]`},description:``},archiveAccountAction:{required:!0,tsType:{name:`AccountStateAction`},description:``},baseCurrency:{required:!0,tsType:{name:`string`},description:``},canManageAccounts:{required:!1,tsType:{name:`boolean`},description:``,defaultValue:{value:`true`,computed:!1}},canWriteTransactions:{required:!1,tsType:{name:`boolean`},description:``,defaultValue:{value:`true`,computed:!1}},createAccountAction:{required:!0,tsType:{name:`AccountStateAction`},description:``},initialErrorKey:{required:!1,tsType:{name:`union`,raw:`string | null`,elements:[{name:`string`},{name:`null`}]},description:``,defaultValue:{value:`null`,computed:!1}},initialErrorMessage:{required:!1,tsType:{name:`union`,raw:`string | null`,elements:[{name:`string`},{name:`null`}]},description:``,defaultValue:{value:`null`,computed:!1}},holderOptions:{required:!0,tsType:{name:`Array`,elements:[{name:`AccountHolderOption`}],raw:`AccountHolderOption[]`},description:``},ledgerName:{required:!0,tsType:{name:`string`},description:``},saveResult:{required:!1,tsType:{name:`union`,raw:`AccountSaveResult | null`,elements:[{name:`union`,raw:`"archived" | "created" | "updated"`,elements:[{name:`literal`,value:`"archived"`},{name:`literal`,value:`"created"`},{name:`literal`,value:`"updated"`}]},{name:`null`}]},description:``,defaultValue:{value:`null`,computed:!1}},updateAccountAction:{required:!0,tsType:{name:`AccountStateAction`},description:``}}}})),W,G,K,q,J,Y,X,Z,Q,$;t((()=>{W=r(),d(),U(),G={title:`Templates/Accounts/AccountsTemplate`,component:M,decorators:[e=>(0,W.jsx)(f,{storageScope:`storybook-accounts-template`,children:(0,W.jsx)(e,{})})],args:{accounts:[{id:`00000000-0000-4000-8000-000000000001`,name:`三菱UFJ银行`,type:`bank`,currency:`JPY`,initial_balance:1e5,current_balance:85e3,sort_order:1,created_at:`2026-01-01T00:00:00.000Z`,holders:[{id:`holder-1`,user_id:`user-1`,display_name:`本地开发用户`,email:`local1@example.test`,display_color:`sky`,role:`owner`,share_ratio:null}]},{id:`00000000-0000-4000-8000-000000000002`,name:`PayPay`,type:`e_money`,currency:`JPY`,initial_balance:0,current_balance:3200,sort_order:2,created_at:`2026-01-02T00:00:00.000Z`,holders:[]}],archiveAccountAction:async()=>({}),baseCurrency:`JPY`,createAccountAction:async()=>({}),holderOptions:[{user_id:`user-1`,display_name:`本地开发用户`,email:`local1@example.test`}],ledgerName:`家庭账本`,updateAccountAction:async()=>({})}},K={name:`账户页面`},q={name:`无账户`,args:{accounts:[]}},J={name:`错误反馈弹窗`,args:{initialErrorKey:`story-error-key-1`,initialErrorMessage:`账户新增失败。请确认账户名称是否重复，或稍后重试。`}},Y={name:`保存成功反馈`,args:{saveResult:`updated`}},X={name:`新增成功反馈`,args:{saveResult:`created`}},Z={name:`删除成功反馈`,args:{saveResult:`archived`}},Q={name:`多持有人多账户`,args:{holderOptions:[{user_id:`user-1`,display_name:`本地开发用户`,email:`local1@example.test`},{user_id:`user-2`,display_name:`本地开发用户2`,email:`local2@example.test`}],accounts:[{id:`00000000-0000-4000-8000-000000000001`,name:`三菱UFJ银行`,type:`bank`,currency:`JPY`,initial_balance:1e5,current_balance:85e3,sort_order:1,created_at:`2026-01-01T00:00:00.000Z`,holders:[{id:`holder-1`,user_id:`user-1`,display_name:`本地开发用户`,email:`local1@example.test`,display_color:`sky`,role:`co_owner`,share_ratio:null},{id:`holder-2`,user_id:`user-2`,display_name:`本地开发用户2`,email:`local2@example.test`,display_color:`sakura`,role:`co_owner`,share_ratio:null}]},{id:`00000000-0000-4000-8000-000000000002`,name:`楽天カード`,type:`credit_card`,currency:`JPY`,initial_balance:0,current_balance:-12500,sort_order:2,created_at:`2026-01-02T00:00:00.000Z`,holders:[{id:`holder-3`,user_id:`user-2`,display_name:`本地开发用户2`,email:`local2@example.test`,display_color:`sakura`,role:`owner`,share_ratio:null}]},{id:`00000000-0000-4000-8000-000000000003`,name:`PayPay`,type:`e_money`,currency:`JPY`,initial_balance:0,current_balance:3200,sort_order:3,created_at:`2026-01-03T00:00:00.000Z`,holders:[]}]}},K.parameters={...K.parameters,docs:{...K.parameters?.docs,source:{originalSource:`{
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
}`,...Q.parameters?.docs?.source}}},$=[`Default`,`Empty`,`WithError`,`SaveSucceeded`,`CreateSucceeded`,`ArchiveSucceeded`,`MultipleHolders`]}))();export{Z as ArchiveSucceeded,X as CreateSucceeded,K as Default,q as Empty,Q as MultipleHolders,Y as SaveSucceeded,J as WithError,$ as __namedExportsOrder,G as default};