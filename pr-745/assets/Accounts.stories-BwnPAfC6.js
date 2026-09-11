import{c as e,i as t}from"./preload-helper-D2yxXLVK.js";import{t as n}from"./react-DAMDAfNa.js";import{t as r}from"./jsx-runtime-Dwpk6tgA.js";import{n as i,t as ee}from"./iframe-Cc3XLrrJ.js";import{n as a,t as o}from"./Chip-Dk_3-59y.js";import{n as s,t as c}from"./Stack-DRbcmy6F.js";import{n as te,t as l}from"./Box-rcs03lYJ.js";import{n as u,t as ne}from"./Typography-CwLqrFKa.js";import{a as re,n as d}from"./paths-B1Daueo6.js";import{n as f,t as ie}from"./UserThemeProvider-cyXSgGYo.js";import{n as ae,t as p}from"./link-Du4AGLbo.js";import{a as oe,o as m}from"./accounts-DpbEXm7k.js";import{a as se,i as ce,o as h}from"./OperationFeedbackDialogs-BbtTJSnZ.js";import{n as le,t as g}from"./IconButton-BvjujjMV.js";import{n as _,t as ue}from"./AccountForm-BGywCV15.js";import{n as v,r as y,t as b}from"./AccountFormDialogShell-Ck__fl6-.js";import{n as x,t as de}from"./AccountList-DTJ3inhp.js";import{n as S,t as fe}from"./AccountSummaryCard-BpOqIP8U.js";import{n as C,t as w}from"./bottomNavigationLayout-U5qtPCTt.js";import{n as T,t as pe}from"./TransactionAmountKeypadLauncher-DXgzoov0.js";import{n as E,t as me}from"./ArrowBackRounded-CxlZpNyn.js";import{n as D,t as he}from"./CreateButton-D7gjLKPD.js";import{n as ge,t as _e}from"./PageShell-Z15Q6558.js";import{n as O,t as ve}from"./fullViewportPageBackgroundSx-BEsR-Htf.js";import{n as ye,t as k}from"./useClearQueryParam-CNSmB_cJ.js";function A({createAccountAction:e,defaultCurrency:t,holderOptions:n,onClose:r,open:i}){return(0,j.jsx)(v,{illustrationSlot:(0,j.jsx)(b,{}),onClose:r,open:i,children:(0,j.jsx)(ue,{createAccountAction:e,defaultCurrency:t,holderOptions:n,onCancel:r})})}var j,M=t((()=>{j=r(),_(),y(),A.__docgenInfo={description:``,methods:[],displayName:`AccountCreateDialog`,props:{createAccountAction:{required:!0,tsType:{name:`ServerAction`},description:``},defaultCurrency:{required:!0,tsType:{name:`string`},description:``},holderOptions:{required:!0,tsType:{name:`Array`,elements:[{name:`AccountHolderOption`}],raw:`AccountHolderOption[]`},description:``},onClose:{required:!0,tsType:{name:`signature`,type:`function`,raw:`() => void`,signature:{arguments:[],return:{name:`void`}}},description:``},open:{required:!0,tsType:{name:`boolean`},description:``}}}}));function N({accounts:e,archiveAccountAction:t,baseCurrency:n,canManageAccounts:r=!0,canWriteTransactions:i=!0,createAccountAction:ee,initialErrorKey:a=null,initialErrorMessage:o=null,holderOptions:c,saveResult:l=null,updateAccountAction:ne}){let[d,f]=(0,I.useState)(`all`),[ie,p]=(0,I.useState)(!1),[m,h]=(0,I.useState)([]),g=(0,I.useRef)(0),_=(0,I.useRef)(new Set),[ue,v]=(0,I.useState)(l),[y,b]=(0,I.useState)(l!==null),[x,S]=(0,I.useState)(l),[C,w]=(0,I.useActionState)(ee,L),[T,E]=(0,I.useActionState)(ne,L),[D,ge]=(0,I.useActionState)(t,L),O=ye(`result`);(0,I.useEffect)(()=>{let e=[{error:o??void 0,errorKey:a??void 0},C,T,D];for(let t of e){if(!t.error||!t.errorKey||_.current.has(t.errorKey))continue;_.current.add(t.errorKey),g.current+=1;let e=`${t.errorKey}-${g.current}`;h(n=>[...n,{id:e,message:t.error}])}},[D,C,a,o,T]),l!==x&&(S(l),l!==null&&(v(l),b(!0),p(!1)));let k=(0,I.useMemo)(()=>d===`all`?e:e.filter(e=>e.type===d),[e,d]),j=d!==`all`&&k.length===0,M=U[ue??`updated`];function N(e){h(t=>t.filter(t=>t.id!==e))}function W(){b(!1),O()}return(0,F.jsxs)(F.Fragment,{children:[(0,F.jsx)(te,{"aria-hidden":`true`,"data-testid":`accounts-page-background`,sx:ve}),(0,F.jsxs)(_e,{maxWidth:`xs`,sx:z,children:[(0,F.jsxs)(s,{spacing:1.35,children:[(0,F.jsxs)(s,{spacing:.4,children:[(0,F.jsxs)(s,{direction:`row`,spacing:.75,sx:{alignItems:`center`},children:[(0,F.jsx)(le,{"aria-label":`返回`,component:ae,href:re.settings,sx:R,children:(0,F.jsx)(me,{})}),(0,F.jsx)(u,{component:`h1`,sx:{flex:1,fontSize:{xs:24,sm:26},fontWeight:900},children:`账户管理`}),r?(0,F.jsx)(he,{onClick:()=>p(!0),sx:V,children:`新增账户`}):null]}),(0,F.jsx)(u,{color:`text.secondary`,variant:`body2`,sx:{pl:5.75},children:`整理家里的现金、银行卡、电子钱包和信用卡`})]}),(0,F.jsx)(fe,{accounts:e,baseCurrency:n}),(0,F.jsxs)(s,{direction:`row`,spacing:.7,sx:B,children:[(0,F.jsx)(P,{label:`全部`,selected:d===`all`,onClick:()=>f(`all`)}),oe.filter(e=>e.value!==`other`).map(e=>(0,F.jsx)(P,{label:e.label,selected:d===e.value,onClick:()=>f(e.value)},e.value))]}),(0,F.jsx)(de,{accounts:k,archiveAccountAction:ge,canManageAccounts:r,emptyDescription:j?`请切换其他账户类型。`:r?void 0:`当前账本还没有可查看的账户。`,emptyTitle:j?`该类型下还没有账户`:void 0,holderOptions:c,saveResult:l,updateAccountAction:E})]}),i?(0,F.jsx)(pe,{}):null,r?(0,F.jsx)(A,{createAccountAction:w,defaultCurrency:n,holderOptions:c,onClose:()=>p(!1),open:ie}):null,m.map((e,t)=>(0,F.jsx)(ce,{bottomOffset:be(t),description:e.message,onClose:()=>N(e.id),open:!0,title:`账户操作失败`},e.id)),(0,F.jsx)(se,{bottomOffset:H,description:M.description,onClose:W,open:y,title:M.title})]})]})}function P({label:e,onClick:t,selected:n}){return(0,F.jsx)(a,{clickable:!0,color:n?`warning`:`default`,label:e,onClick:t,sx:{fontWeight:800},variant:n?`filled`:`outlined`})}function be(e){return`calc(${H} + ${e*88}px)`}var F,I,L,R,z,B,V,H,U,W=t((()=>{F=r(),E(),l(),o(),g(),c(),ne(),p(),I=e(n()),D(),d(),h(),M(),x(),S(),C(),T(),ge(),O(),k(),i(),m(),L={},R={color:`text.primary`,mt:.2},z={px:{xs:.75},py:{xs:.75}},B={flexWrap:`nowrap`,mx:-.5,overflowX:`auto`,px:.5,scrollbarWidth:`none`,"&::-webkit-scrollbar":{display:`none`}},V={borderRadius:`${ee.radius.full}px`,flexShrink:0,fontWeight:800,minHeight:40,px:2,whiteSpace:`nowrap`},H=`calc(${w.shellPaddingBottom} + 8px)`,U={archived:{description:`账户已删除，历史记录不会被删除。`,title:`删除成功`},created:{description:`账户已创建。`,title:`新增成功`},updated:{description:`账户修改已保存。`,title:`保存成功`}},N.__docgenInfo={description:``,methods:[],displayName:`AccountsTemplate`,props:{accounts:{required:!0,tsType:{name:`Array`,elements:[{name:`Account`}],raw:`Account[]`},description:``},archiveAccountAction:{required:!0,tsType:{name:`AccountStateAction`},description:``},baseCurrency:{required:!0,tsType:{name:`string`},description:``},canManageAccounts:{required:!1,tsType:{name:`boolean`},description:``,defaultValue:{value:`true`,computed:!1}},canWriteTransactions:{required:!1,tsType:{name:`boolean`},description:``,defaultValue:{value:`true`,computed:!1}},createAccountAction:{required:!0,tsType:{name:`AccountStateAction`},description:``},initialErrorKey:{required:!1,tsType:{name:`union`,raw:`string | null`,elements:[{name:`string`},{name:`null`}]},description:``,defaultValue:{value:`null`,computed:!1}},initialErrorMessage:{required:!1,tsType:{name:`union`,raw:`string | null`,elements:[{name:`string`},{name:`null`}]},description:``,defaultValue:{value:`null`,computed:!1}},holderOptions:{required:!0,tsType:{name:`Array`,elements:[{name:`AccountHolderOption`}],raw:`AccountHolderOption[]`},description:``},ledgerName:{required:!0,tsType:{name:`string`},description:``},saveResult:{required:!1,tsType:{name:`union`,raw:`AccountSaveResult | null`,elements:[{name:`union`,raw:`"archived" | "created" | "updated"`,elements:[{name:`literal`,value:`"archived"`},{name:`literal`,value:`"created"`},{name:`literal`,value:`"updated"`}]},{name:`null`}]},description:``,defaultValue:{value:`null`,computed:!1}},updateAccountAction:{required:!0,tsType:{name:`AccountStateAction`},description:``}}}})),G,K,q,J,Y,X,Z,Q,$,xe;t((()=>{G=r(),f(),W(),K={title:`Templates/Accounts/AccountsTemplate`,component:N,decorators:[e=>(0,G.jsx)(ie,{storageScope:`storybook-accounts-template`,children:(0,G.jsx)(e,{})})],args:{accounts:[{id:`00000000-0000-4000-8000-000000000001`,name:`三菱UFJ银行`,type:`bank`,currency:`JPY`,initial_balance:1e5,current_balance:85e3,sort_order:1,created_at:`2026-01-01T00:00:00.000Z`,holders:[{id:`holder-1`,user_id:`user-1`,display_name:`本地开发用户`,email:`local1@example.test`,display_color:`sky`,role:`owner`,share_ratio:null}]},{id:`00000000-0000-4000-8000-000000000002`,name:`PayPay`,type:`e_money`,currency:`JPY`,initial_balance:0,current_balance:3200,sort_order:2,created_at:`2026-01-02T00:00:00.000Z`,holders:[]}],archiveAccountAction:async()=>({}),baseCurrency:`JPY`,createAccountAction:async()=>({}),holderOptions:[{user_id:`user-1`,display_name:`本地开发用户`,email:`local1@example.test`}],ledgerName:`家庭账本`,updateAccountAction:async()=>({})}},q={name:`账户页面`},J={name:`无账户`,args:{accounts:[]}},Y={name:`错误反馈弹窗`,args:{initialErrorKey:`story-error-key-1`,initialErrorMessage:`账户新增失败。请确认账户名称是否重复，或稍后重试。`}},X={name:`保存成功反馈`,args:{saveResult:`updated`}},Z={name:`新增成功反馈`,args:{saveResult:`created`}},Q={name:`删除成功反馈`,args:{saveResult:`archived`}},$={name:`多持有人多账户`,args:{holderOptions:[{user_id:`user-1`,display_name:`本地开发用户`,email:`local1@example.test`},{user_id:`user-2`,display_name:`本地开发用户2`,email:`local2@example.test`}],accounts:[{id:`00000000-0000-4000-8000-000000000001`,name:`三菱UFJ银行`,type:`bank`,currency:`JPY`,initial_balance:1e5,current_balance:85e3,sort_order:1,created_at:`2026-01-01T00:00:00.000Z`,holders:[{id:`holder-1`,user_id:`user-1`,display_name:`本地开发用户`,email:`local1@example.test`,display_color:`sky`,role:`co_owner`,share_ratio:null},{id:`holder-2`,user_id:`user-2`,display_name:`本地开发用户2`,email:`local2@example.test`,display_color:`sakura`,role:`co_owner`,share_ratio:null}]},{id:`00000000-0000-4000-8000-000000000002`,name:`楽天カード`,type:`credit_card`,currency:`JPY`,initial_balance:0,current_balance:-12500,sort_order:2,created_at:`2026-01-02T00:00:00.000Z`,holders:[{id:`holder-3`,user_id:`user-2`,display_name:`本地开发用户2`,email:`local2@example.test`,display_color:`sakura`,role:`owner`,share_ratio:null}]},{id:`00000000-0000-4000-8000-000000000003`,name:`PayPay`,type:`e_money`,currency:`JPY`,initial_balance:0,current_balance:3200,sort_order:3,created_at:`2026-01-03T00:00:00.000Z`,holders:[]}]}},q.parameters={...q.parameters,docs:{...q.parameters?.docs,source:{originalSource:`{
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