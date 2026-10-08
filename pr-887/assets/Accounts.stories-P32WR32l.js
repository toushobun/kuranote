import{c as e,i as t}from"./preload-helper-D2yxXLVK.js";import{t as n}from"./react-DAMDAfNa.js";import{t as r}from"./jsx-runtime-Dwpk6tgA.js";import{n as i,t as a}from"./Chip-D8tX3z-0.js";import{n as o,t as s}from"./Stack-Blj2xom2.js";import{a as c}from"./account--_gaLiDT.js";import{t as l}from"./accounts-D1-BAErc.js";import{c as u,i as d,t as ee}from"./paths-D7uT-HPS.js";import{n as f,t as p}from"./UserThemeProvider-DHC_FJWg.js";import{a as te,c as m,s as ne}from"./OperationFeedbackDialogs-BFlHnpVr.js";import{n as h,r as re,t as ie}from"./bottomNavigationLayout-CT4WtILB.js";import{n as g,t as _}from"./AccountForm-mCG6jaAy.js";import{n as v,r as y,t as b}from"./AccountFormDialogShell-CgM2n1Z1.js";import{n as x,t as ae}from"./AccountList-CfnXBr4d.js";import{n as S,t as C}from"./AccountSummaryCard-D9ytUKg_.js";import{n as w,t as oe}from"./CreateButton-CvbjQFGn.js";import{n as T,r as se,t as ce}from"./SettingsPageLayout-DbVlxAiV.js";import{n as E,t as D}from"./useClearQueryParam-nESgVTlE.js";import{n as O,t as le}from"./TransactionAmountKeypadLauncher-CFINHCd3.js";import{n as k,t as A}from"./accountMessages-0m6WYSVf.js";function j({createAccountAction:e,defaultCurrency:t,holderOptions:n,onClose:r,open:i,placeholderHolderOptions:a=[],returnTo:o=null}){return(0,M.jsx)(v,{illustrationSlot:(0,M.jsx)(b,{}),onClose:r,open:i,children:(0,M.jsx)(_,{createAccountAction:e,defaultCurrency:t,holderOptions:n,onCancel:r,placeholderHolderOptions:a,returnTo:o})})}var M,N=t((()=>{M=r(),g(),y(),j.__docgenInfo={description:``,methods:[],displayName:`AccountCreateDialog`,props:{createAccountAction:{required:!0,tsType:{name:`ServerAction`},description:``},defaultCurrency:{required:!0,tsType:{name:`string`},description:``},holderOptions:{required:!0,tsType:{name:`Array`,elements:[{name:`AccountHolderOption`}],raw:`AccountHolderOption[]`},description:``},onClose:{required:!0,tsType:{name:`signature`,type:`function`,raw:`() => void`,signature:{arguments:[],return:{name:`void`}}},description:``},open:{required:!0,tsType:{name:`boolean`},description:``},placeholderHolderOptions:{required:!1,tsType:{name:`Array`,elements:[{name:`AccountPlaceholderHolderOption`}],raw:`AccountPlaceholderHolderOption[]`},description:``,defaultValue:{value:`[]`,computed:!1}},returnTo:{required:!1,tsType:{name:`union`,raw:`string | null`,elements:[{name:`string`},{name:`null`}]},description:``,defaultValue:{value:`null`,computed:!1}}}}}));function P({accounts:e,archiveAccountAction:t,baseCurrency:n,canManageAccounts:r=!0,canWriteTransactions:i=!0,createAccountAction:a,initialErrorKey:s=null,initialErrorMessage:l=null,holderOptions:d,openCreateDialog:f=!1,placeholderHolderOptions:p=[],returnTo:m=null,saveResult:h=null,updateAccountAction:g}){let[_,v]=(0,L.useState)(`all`),[y,b]=(0,L.useState)(f&&r),[x,S]=(0,L.useState)([]),w=(0,L.useRef)(0),T=(0,L.useRef)(new Set),[D,O]=(0,L.useState)(h),[k,M]=(0,L.useState)(h!==null),[N,P]=(0,L.useState)(h),[z,B]=(0,L.useActionState)(a,R),[U,W]=(0,L.useActionState)(g,R),[G,K]=(0,L.useActionState)(t,R),q=E(`result`),J=E(ee);(0,L.useEffect)(()=>{f&&J()},[f]),(0,L.useEffect)(()=>{let e=[{error:l??void 0,errorKey:s??void 0},z,U,G];for(let t of e){if(!t.error||!t.errorKey||T.current.has(t.errorKey))continue;T.current.add(t.errorKey),w.current+=1;let e=`${t.errorKey}-${w.current}`;S(n=>[...n,{id:e,message:t.error}])}},[G,z,s,l,U]),h!==N&&(P(h),h!==null&&(O(h),M(!0),b(!1)));let Y=(0,L.useMemo)(()=>_===`all`?e:e.filter(e=>e.type===_),[e,_]),X=_!==`all`&&Y.length===0,Z=H[D??`updated`];function Q(e){S(t=>t.filter(t=>t.id!==e))}function $(){M(!1),q()}return(0,I.jsxs)(ce,{action:r?(0,I.jsx)(oe,{onClick:()=>b(!0),size:`small`,sx:se,children:A.create}):null,back:{href:u.settings,label:A.backToSettings},subtitle:A.subtitle,title:A.title,children:[(0,I.jsxs)(o,{spacing:1.35,children:[(0,I.jsx)(C,{accounts:e,baseCurrency:n}),(0,I.jsxs)(o,{direction:`row`,spacing:.7,sx:V,children:[(0,I.jsx)(F,{label:`全部`,selected:_===`all`,onClick:()=>v(`all`)}),c.filter(e=>e.value!==`other`).map(e=>(0,I.jsx)(F,{label:e.label,selected:_===e.value,onClick:()=>v(e.value)},e.value))]}),(0,I.jsx)(ae,{accounts:Y,archiveAccountAction:K,canManageAccounts:r,emptyDescription:X?`请切换其他账户类型。`:r?void 0:`当前账本还没有可查看的账户。`,emptyTitle:X?`该类型下还没有账户`:void 0,holderOptions:d,placeholderHolderOptions:p,saveResult:h,updateAccountAction:W})]}),i?(0,I.jsx)(le,{}):null,r?(0,I.jsx)(j,{createAccountAction:B,defaultCurrency:n,holderOptions:d,onClose:()=>b(!1),placeholderHolderOptions:p,open:y,returnTo:m}):null,x.map((e,t)=>(0,I.jsx)(te,{aboveModal:!0,bottomOffset:re(t),description:e.message,onClose:()=>Q(e.id),open:!0,title:`账户操作失败`},e.id)),(0,I.jsx)(ne,{bottomOffset:ie.feedbackBottomOffset,description:Z.description,onClose:$,open:k,title:Z.title})]})}function F({label:e,onClick:t,selected:n}){return(0,I.jsx)(i,{clickable:!0,color:n?`warning`:`default`,label:e,onClick:t,sx:[{fontWeight:800},n?B:z],variant:n?`filled`:`outlined`})}var I,L,R,z,B,V,H,U=t((()=>{I=r(),a(),s(),L=e(n()),w(),k(),d(),m(),N(),x(),S(),h(),O(),T(),D(),l(),R={},z={"@media (hover: hover)":{"&&.MuiChip-clickable:hover":{bgcolor:`action.hover`}},"@media (hover: none)":{"&&.MuiChip-clickable":{bgcolor:`transparent`}}},B={"@media (hover: hover)":{"&&.MuiChip-clickable:hover":{bgcolor:`warning.main`}},"@media (hover: none)":{"&&.MuiChip-clickable":{bgcolor:`warning.main`}}},V={flexWrap:`nowrap`,mx:-.5,overflowX:`auto`,px:.5,scrollbarWidth:`none`,"&::-webkit-scrollbar":{display:`none`}},H={archived:{description:`账户已删除，历史记录不会被删除。`,title:`删除成功`},created:{description:`账户已创建。`,title:`新增成功`},updated:{description:`账户修改已保存。`,title:`保存成功`}},P.__docgenInfo={description:``,methods:[],displayName:`AccountsTemplate`,props:{accounts:{required:!0,tsType:{name:`Array`,elements:[{name:`Account`}],raw:`Account[]`},description:``},archiveAccountAction:{required:!0,tsType:{name:`AccountStateAction`},description:``},baseCurrency:{required:!0,tsType:{name:`string`},description:``},canManageAccounts:{required:!1,tsType:{name:`boolean`},description:``,defaultValue:{value:`true`,computed:!1}},canWriteTransactions:{required:!1,tsType:{name:`boolean`},description:``,defaultValue:{value:`true`,computed:!1}},createAccountAction:{required:!0,tsType:{name:`AccountStateAction`},description:``},initialErrorKey:{required:!1,tsType:{name:`union`,raw:`string | null`,elements:[{name:`string`},{name:`null`}]},description:``,defaultValue:{value:`null`,computed:!1}},initialErrorMessage:{required:!1,tsType:{name:`union`,raw:`string | null`,elements:[{name:`string`},{name:`null`}]},description:``,defaultValue:{value:`null`,computed:!1}},holderOptions:{required:!0,tsType:{name:`Array`,elements:[{name:`AccountHolderOption`}],raw:`AccountHolderOption[]`},description:``},ledgerName:{required:!0,tsType:{name:`string`},description:``},openCreateDialog:{required:!1,tsType:{name:`boolean`},description:``,defaultValue:{value:`false`,computed:!1}},placeholderHolderOptions:{required:!1,tsType:{name:`Array`,elements:[{name:`AccountPlaceholderHolderOption`}],raw:`AccountPlaceholderHolderOption[]`},description:``,defaultValue:{value:`[]`,computed:!1}},returnTo:{required:!1,tsType:{name:`union`,raw:`string | null`,elements:[{name:`string`},{name:`null`}]},description:``,defaultValue:{value:`null`,computed:!1}},saveResult:{required:!1,tsType:{name:`union`,raw:`AccountSaveResult | null`,elements:[{name:`union`,raw:`"archived" | "created" | "updated"`,elements:[{name:`literal`,value:`"archived"`},{name:`literal`,value:`"created"`},{name:`literal`,value:`"updated"`}]},{name:`null`}]},description:``,defaultValue:{value:`null`,computed:!1}},updateAccountAction:{required:!0,tsType:{name:`AccountStateAction`},description:``}}}})),W,G,K,q,J,Y,X,Z,Q,$;t((()=>{W=r(),f(),U(),G={title:`Templates/Accounts/AccountsTemplate`,component:P,decorators:[e=>(0,W.jsx)(p,{children:(0,W.jsx)(e,{})})],args:{accounts:[{id:`00000000-0000-4000-8000-000000000001`,name:`三菱UFJ银行`,type:`bank`,currency:`JPY`,initial_balance:1e5,current_balance:85e3,sort_order:1,created_at:`2026-01-01T00:00:00.000Z`,holders:[{id:`holder-1`,user_id:`user-1`,kind:`member`,placeholder_id:null,display_name:`本地开发用户`,email:`local1@example.test`,display_color:`sky`,role:`owner`,share_ratio:null}]},{id:`00000000-0000-4000-8000-000000000002`,name:`PayPay`,type:`e_money`,currency:`JPY`,initial_balance:0,current_balance:3200,sort_order:2,created_at:`2026-01-02T00:00:00.000Z`,holders:[]}],archiveAccountAction:async()=>({}),baseCurrency:`JPY`,createAccountAction:async()=>({}),holderOptions:[{user_id:`user-1`,display_name:`本地开发用户`,email:`local1@example.test`}],ledgerName:`家庭账本`,updateAccountAction:async()=>({})}},K={name:`账户页面`},q={name:`无账户`,args:{accounts:[]}},J={name:`错误反馈弹窗`,args:{initialErrorKey:`story-error-key-1`,initialErrorMessage:`账户新增失败。请确认账户名称是否重复，或稍后重试。`}},Y={name:`保存成功反馈`,args:{saveResult:`updated`}},X={name:`新增成功反馈`,args:{saveResult:`created`}},Z={name:`删除成功反馈`,args:{saveResult:`archived`}},Q={name:`多持有人多账户`,args:{holderOptions:[{user_id:`user-1`,display_name:`本地开发用户`,email:`local1@example.test`},{user_id:`user-2`,display_name:`本地开发用户2`,email:`local2@example.test`}],accounts:[{id:`00000000-0000-4000-8000-000000000001`,name:`三菱UFJ银行`,type:`bank`,currency:`JPY`,initial_balance:1e5,current_balance:85e3,sort_order:1,created_at:`2026-01-01T00:00:00.000Z`,holders:[{id:`holder-1`,user_id:`user-1`,kind:`member`,placeholder_id:null,display_name:`本地开发用户`,email:`local1@example.test`,display_color:`sky`,role:`co_owner`,share_ratio:null},{id:`holder-2`,user_id:`user-2`,kind:`member`,placeholder_id:null,display_name:`本地开发用户2`,email:`local2@example.test`,display_color:`sakura`,role:`co_owner`,share_ratio:null}]},{id:`00000000-0000-4000-8000-000000000002`,name:`楽天カード`,type:`credit_card`,currency:`JPY`,initial_balance:0,current_balance:-12500,sort_order:2,created_at:`2026-01-02T00:00:00.000Z`,holders:[{id:`holder-3`,user_id:`user-2`,kind:`member`,placeholder_id:null,display_name:`本地开发用户2`,email:`local2@example.test`,display_color:`sakura`,role:`owner`,share_ratio:null}]},{id:`00000000-0000-4000-8000-000000000003`,name:`PayPay`,type:`e_money`,currency:`JPY`,initial_balance:0,current_balance:3200,sort_order:3,created_at:`2026-01-03T00:00:00.000Z`,holders:[]}]}},K.parameters={...K.parameters,docs:{...K.parameters?.docs,source:{originalSource:`{
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
}`,...Q.parameters?.docs?.source}}},$=[`Default`,`Empty`,`WithError`,`SaveSucceeded`,`CreateSucceeded`,`ArchiveSucceeded`,`MultipleHolders`]}))();export{Z as ArchiveSucceeded,X as CreateSucceeded,K as Default,q as Empty,Q as MultipleHolders,Y as SaveSucceeded,J as WithError,$ as __namedExportsOrder,G as default};