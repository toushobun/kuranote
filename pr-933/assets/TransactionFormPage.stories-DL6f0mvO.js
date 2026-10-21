import{c as e,i as t}from"./preload-helper-D2yxXLVK.js";import{t as n}from"./react-DAMDAfNa.js";import{t as r}from"./jsx-runtime-Dwpk6tgA.js";import{_ as i,a,d as o,g as s,m as c,s as l,u}from"./iframe-DIxnxdab.js";import{n as d,t as f}from"./Stack-Blj2xom2.js";import{i as p,s as m}from"./transactionAmountInput-BaIP6MYU.js";import{n as h,t as g}from"./Box-CbAZuMAz.js";import{n as _,t as v}from"./Typography-CWKirwdW.js";import{i as y,t as b}from"./transactionMessages-D2Jf1vjN.js";import{n as x,t as ee}from"./Button-DJTTRrLP.js";import{n as S,t as C}from"./link-Du4AGLbo.js";import{n as te,t as ne}from"./PrimaryActionButton-Cv6NJzP8.js";import{a as re,c as w,i as ie}from"./OperationFeedbackDialogs-i9pkdyvZ.js";import{n as ae,t as oe}from"./IconButton-C_ZkoDI7.js";import{n as se,o as ce,s as le,t as ue}from"./DialogContent-BqJEQcp1.js";import{n as de,t as T}from"./DialogActions-BOHXclwd.js";import{n as fe,t as pe}from"./DialogTitle-BEi9RhcJ.js";import{n as me,t as he}from"./bottomNavigationLayout-clIJH7a9.js";import{E as ge,T as E,t as D}from"./transaction-CdGOSO9V.js";import{n as _e,t as ve}from"./TransactionTypeNavigation-DBOYfniY.js";import{r as ye,t as be}from"./userThemeCardSx-vnoApgu-.js";import{n as xe,t as Se}from"./DialogContentText-CvPgR_43.js";import{n as Ce,r as we}from"./ErrorState-Cpsc-YgN.js";import{n as Te,t as Ee}from"./ArrowBackRounded-CpnRt5D2.js";import{n as De,t as Oe}from"./fullViewportPageBackgroundSx-BEsR-Htf.js";import{n as ke,t as Ae}from"./LinkedTransactionSyncConfirmationDialog-6iHK9SGi.js";import{r as je,t as Me}from"./TransactionAmountKeypadLauncher-TZNL_3NI.js";import{o as Ne,r as Pe,t as Fe}from"./TransactionForm.styles-Da7thOZx.js";import{n as Ie,t as O}from"./TransactionForm-Cw8UycwQ.js";import{n as Le,t as Re}from"./EditTransactionDirtyContext-CaDsW0-5.js";import{n as ze,t as k}from"./TransferTransactionForm-BRZbbaLJ.js";function Be(e){let t=new FormData;for(let[n,r]of e.entries())t.append(n,r);return t}function Ve(e){let t=(0,A.useRef)(null),[n,r]=(0,A.useState)(null),[i,a,o]=(0,A.useActionState)((0,A.useCallback)(async(n,r)=>{let i=await e(n,r);return i.errorCode===E.linkedSyncConfirmationRequired&&(t.current=Be(r)),i},[e]),{}),s=!!(i!==n&&i.error&&i.errorCode===E.linkedSyncConfirmationRequired),c=!!(i!==n&&i.error&&i.errorCode!==E.linkedSyncConfirmationRequired);function l(){t.current=null,r(i)}function u(){let e=t.current;e&&(e.set(`confirmSync`,`true`),t.current=null,r(i),(0,A.startTransition)(()=>a(e)))}return{cancelConfirmation:l,closeFailure:()=>r(i),confirmSync:u,formAction:a,isConfirmationOpen:s,isFailureOpen:c,isPending:o,state:i}}var A,He=t((()=>{A=e(n()),D()}));function j(e){return`edit-${e}-transaction-form`}function M(e){if(!e)throw Error(`transactionRecordId is required for edit transaction.`);return e}function Ue({activeType:e,panels:t}){let n=(0,I.useRef)(null),r=(0,I.useRef)(null),i=(0,I.useRef)(null),[a,o]=(0,I.useState)(null),s=tt.indexOf(e);return(0,I.useLayoutEffect)(()=>{function t(){return e===`expense`?n.current:e===`income`?r.current:i.current}let a=t();if(!a)return;function s(){let e=t();e&&o(e.getBoundingClientRect().height)}if(s(),typeof ResizeObserver>`u`)return;let c=new ResizeObserver(s);return c.observe(a),()=>{c.disconnect()}},[e]),(0,F.jsx)(h,{"data-testid":`transaction-type-slide-panels`,sx:e=>({height:a??`auto`,overflow:`hidden`,transition:e.transitions.create(`height`,{duration:e.transitions.duration.shorter,easing:e.transitions.easing.easeInOut}),width:`100%`}),children:(0,F.jsx)(h,{sx:e=>({alignItems:`flex-start`,display:`flex`,transform:`translateX(-${s*100}%)`,transition:e.transitions.create(`transform`,{duration:e.transitions.duration.shorter,easing:e.transitions.easing.easeInOut}),width:`100%`}),children:tt.map(a=>(0,F.jsx)(h,{ref:a===`expense`?n:a===`income`?r:i,"aria-hidden":a!==e,"data-testid":`transaction-type-slide-panel-${a}`,inert:a===e?void 0:!0,sx:{flex:`0 0 100%`},children:t[a]},a))})})}function We(e){return(0,F.jsxs)(F.Fragment,{children:[(0,F.jsx)(Ke,{...e}),(0,F.jsx)(Me,{})]})}function N({operation:e,reason:t=`permission`}){let n=e===`create`?`新增`:`编辑`,r=e===`edit`&&t!==`permission`?y[t]:null;return(0,F.jsxs)(d,{spacing:2,children:[(0,F.jsx)(qe,{title:`${n}记账`}),(0,F.jsx)(Ce,{title:r?y.title:`无法${n}记账`,description:r??`当前账本角色没有${n}记账的权限。`,action:(0,F.jsx)(x,{component:S,href:o.transactions,variant:`outlined`,children:`返回明细`})})]})}function Ge(e){let t=c(e);return{account:a(t),merchant:u(t)}}function Ke({accountOptions:e,action:t,categoryOptions:n,errorMessage:r,frequentCategoryIds:i,initialType:o,merchantOptions:s,refundPickerView:l,loadRefundGroupItemsAction:u,loadRefundMoreGroupsAction:f,loadRefundSearchPageAction:p,transactionItemSpecialStatusEnabled:m}){let[h,g]=(0,I.useActionState)(t,{}),_=h.error??r,[v,y]=(0,I.useState)(o??`expense`),b=(0,I.useRef)(o===`income`?`income`:`expense`),[,x]=(0,I.useState)({expense:!0,income:!0,transfer:!0});(0,I.useEffect)(()=>{v!==`transfer`&&(b.current=v)},[v]);function ee(e){if(e===`normal`){y(b.current);return}y(`transfer`)}let S=(0,I.useMemo)(()=>({expense:(0,F.jsx)(O,{action:g,accountOptions:e,categoryOptions:n,errorMessage:_,frequentCategoryIds:i,formId:`new-expense-transaction-form`,hideHeader:!0,initialType:`expense`,merchantOptions:s,refundPickerView:l,loadRefundGroupItemsAction:u,loadRefundMoreGroupsAction:f,loadRefundSearchPageAction:p,setupHrefs:Ge(`expense`),transactionItemSpecialStatusEnabled:m,onSubmitDisabledChange:e=>x(t=>({...t,expense:e}))}),income:(0,F.jsx)(O,{action:g,accountOptions:e,categoryOptions:n,errorMessage:_,frequentCategoryIds:i,formId:`new-income-transaction-form`,hideHeader:!0,initialType:`income`,merchantOptions:s,refundPickerView:l,loadRefundGroupItemsAction:u,loadRefundMoreGroupsAction:f,loadRefundSearchPageAction:p,setupHrefs:Ge(`income`),transactionItemSpecialStatusEnabled:m,onSubmitDisabledChange:e=>x(t=>({...t,income:e}))}),transfer:(0,F.jsx)(k,{action:g,accountOptions:e,addAccountHref:a(c(`transfer`)),errorMessage:_,formId:`new-transfer-transaction-form`,hideHeader:!0,onSubmitDisabledChange:e=>x(t=>({...t,transfer:e}))})}),[g,e,n,i,_,s,l,u,f,p,m]);return(0,F.jsxs)(d,{spacing:0,children:[(0,F.jsx)(qe,{title:`记一笔`}),(0,F.jsx)(ve,{activeType:v===`transfer`?`transfer`:`normal`,onChange:ee}),(0,F.jsx)(Ue,{activeType:v,panels:S})]})}function qe({hasUnsavedChanges:e=!1,onClose:t,title:n}){return(0,F.jsxs)(h,{sx:rt,children:[e&&t?(0,F.jsx)(ae,{"aria-label":`关闭`,onClick:t,sx:it,children:(0,F.jsx)(Ee,{})}):(0,F.jsx)(ae,{"aria-label":`关闭`,component:S,href:o.transactions,sx:it,children:(0,F.jsx)(Ee,{})}),(0,F.jsx)(_,{component:`h1`,variant:`h5`,sx:at,children:n}),(0,F.jsx)(h,{"aria-hidden":!0,sx:{width:40}})]})}function Je({activeType:e,deleteAction:t,hasLinkedIncomeItems:n,isSaveConfirmationOpen:r,isSaveFailureOpen:i,isSavePending:a,onCancelSync:s,onCloseSaveFailure:c,onConfirmSync:l,panels:u,saveErrorMessage:f,setActiveType:p,submitDisabledByType:m,transactionRecordId:g}){let[_,v]=(0,I.useActionState)(t,{}),[y,b]=(0,I.useState)(!1),[ee,C]=(0,I.useState)(!1),[te,w]=(0,I.useState)(!1),[ae,oe]=(0,I.useState)(_),ce=(0,I.useRef)(e===`transfer`?`expense`:e),ue=e===`transfer`?`transfer`:`normal`,T=(0,I.useCallback)(()=>b(!0),[]);(0,I.useEffect)(()=>{e!==`transfer`&&(ce.current=e)},[e]),(0,I.useEffect)(()=>{if(!y)return;function e(e){e.preventDefault(),e.returnValue=``}return window.addEventListener(`beforeunload`,e),()=>window.removeEventListener(`beforeunload`,e)},[y]);function pe(e){T(),p(e===`transfer`?`transfer`:ce.current)}function me(){let t=document.getElementById(j(e))?.closest(`form`);t instanceof HTMLFormElement&&(C(!1),t.requestSubmit())}function D(){let e=document.getElementById(nt);e instanceof HTMLFormElement&&(w(!1),e.requestSubmit())}return(0,F.jsxs)(Re,{onDirty:T,children:[(0,F.jsxs)(d,{onChangeCapture:T,spacing:0,children:[(0,F.jsx)(qe,{hasUnsavedChanges:y,onClose:()=>C(!0),title:`编辑记账`}),(0,F.jsx)(ve,{activeType:ue,onChange:pe}),(0,F.jsx)(Ue,{activeType:e,panels:u}),(0,F.jsxs)(h,{sx:ot,children:[(0,F.jsx)(x,{color:`error`,onClick:()=>w(!0),size:`large`,variant:`outlined`,sx:ct,children:`删除`}),(0,F.jsx)(ne,{disabled:m[e]||a,form:j(e),size:`large`,type:`submit`,sx:st,children:`保存修改`})]})]}),(0,F.jsx)(`form`,{action:v,id:nt,children:(0,F.jsx)(`input`,{name:`transactionRecordId`,readOnly:!0,type:`hidden`,value:g})}),(0,F.jsx)(Me,{}),(0,F.jsxs)(le,{"aria-labelledby":`unsaved-transaction-dialog-title`,onClose:()=>C(!1),open:ee,children:[(0,F.jsx)(fe,{id:`unsaved-transaction-dialog-title`,children:`尚未保存`}),(0,F.jsx)(se,{children:(0,F.jsx)(xe,{children:`修正的内容尚未保存，是否保存？`})}),(0,F.jsxs)(de,{children:[(0,F.jsx)(x,{onClick:()=>C(!1),children:`继续编辑`}),(0,F.jsx)(x,{component:S,href:o.transactions,color:`error`,children:`放弃修改`}),(0,F.jsx)(x,{onClick:me,variant:`contained`,children:`保存`})]})]}),(0,F.jsx)(ie,{description:n?`删除后这笔记账会从明细页移除，并解除退款 / 报销关联，目标支出的核销净额会相应变化。是否继续？`:`删除后这笔记账会从明细页移除，是否继续？`,onCancel:()=>w(!1),onConfirm:D,open:te,title:`删除记账？`}),(0,F.jsx)(Ae,{onCancel:()=>{b(!0),s()},onConfirm:l,open:r}),(0,F.jsx)(re,{bottomOffset:he.feedbackBottomOffset,description:f,onClose:()=>{b(!0),c()},open:i,title:`保存失败`}),(0,F.jsx)(re,{bottomOffset:he.feedbackBottomOffset,description:_.error,onClose:()=>oe(_),open:!!(_.error&&_!==ae),title:_.errorCode===E.linkedDeleteForbidden?ge.deleteForbidden:`删除失败`})]})}function Ye({accountOptions:e,action:t,categoryOptions:n,deleteAction:r,errorMessage:i,frequentCategoryIds:a,initialValues:o,merchantOptions:s,transactionItemSpecialStatusEnabled:c}){let l=Ve(t),u=i,[d,f]=(0,I.useState)(`transfer`),[p,m]=(0,I.useState)({expense:!0,income:!0,transfer:!0}),h=(0,I.useMemo)(()=>({expense:(0,F.jsxs)(F.Fragment,{children:[(0,F.jsx)(`input`,{form:j(`expense`),name:`sourceType`,readOnly:!0,type:`hidden`,value:`transfer`}),(0,F.jsx)(O,{action:l.formAction,accountOptions:e,categoryOptions:n,errorMessage:u,frequentCategoryIds:a,formId:j(`expense`),hideHeader:!0,hideSubmitButton:!0,initialValues:Qe(o,`expense`),merchantOptions:s,transactionItemSpecialStatusEnabled:c,onSubmitDisabledChange:e=>m(t=>({...t,expense:e})),submitLabel:`保存修改`})]}),income:(0,F.jsxs)(F.Fragment,{children:[(0,F.jsx)(`input`,{form:j(`income`),name:`sourceType`,readOnly:!0,type:`hidden`,value:`transfer`}),(0,F.jsx)(O,{action:l.formAction,accountOptions:e,categoryOptions:n,errorMessage:u,frequentCategoryIds:a,formId:j(`income`),hideHeader:!0,hideSubmitButton:!0,initialValues:Qe(o,`income`),merchantOptions:s,transactionItemSpecialStatusEnabled:c,onSubmitDisabledChange:e=>m(t=>({...t,income:e})),submitLabel:`保存修改`})]}),transfer:(0,F.jsx)(k,{action:l.formAction,accountOptions:e,errorMessage:u,formId:j(`transfer`),hideHeader:!0,hideSubmitButton:!0,initialValues:o,onSubmitDisabledChange:e=>m(t=>({...t,transfer:e})),sourceType:`transfer`})}),[l.formAction,e,n,a,u,o,s,c]);return(0,F.jsx)(Je,{activeType:d,deleteAction:r,hasLinkedIncomeItems:!1,isSaveConfirmationOpen:l.isConfirmationOpen,isSaveFailureOpen:l.isFailureOpen,isSavePending:l.isPending,onCancelSync:l.cancelConfirmation,onCloseSaveFailure:l.closeFailure,onConfirmSync:l.confirmSync,panels:h,saveErrorMessage:l.state.error,setActiveType:f,submitDisabledByType:p,transactionRecordId:M(o.transactionRecordId)})}function P({accountOptions:e,action:t,categoryOptions:n,deleteAction:r,errorMessage:i,frequentCategoryIds:a,initialValues:o,merchantOptions:s,transactionItemSpecialStatusEnabled:c}){let l=Ve(t),u=i,[d,f]=(0,I.useState)(o.type),[p,m]=(0,I.useState)({expense:!0,income:!0,transfer:!0}),h=(0,I.useMemo)(()=>({expense:(0,F.jsxs)(F.Fragment,{children:[(0,F.jsx)(`input`,{form:j(`expense`),name:`sourceType`,readOnly:!0,type:`hidden`,value:o.type}),(0,F.jsx)(O,{action:l.formAction,accountOptions:e,categoryOptions:n,errorMessage:u,frequentCategoryIds:a,formId:j(`expense`),hideHeader:!0,hideSubmitButton:!0,initialValues:Xe(o,`expense`),merchantOptions:s,transactionItemSpecialStatusEnabled:c,onSubmitDisabledChange:e=>m(t=>({...t,expense:e})),submitLabel:`保存修改`})]}),income:(0,F.jsxs)(F.Fragment,{children:[(0,F.jsx)(`input`,{form:j(`income`),name:`sourceType`,readOnly:!0,type:`hidden`,value:o.type}),(0,F.jsx)(O,{action:l.formAction,accountOptions:e,categoryOptions:n,errorMessage:u,frequentCategoryIds:a,formId:j(`income`),hideHeader:!0,hideSubmitButton:!0,initialValues:Xe(o,`income`),merchantOptions:s,transactionItemSpecialStatusEnabled:c,onSubmitDisabledChange:e=>m(t=>({...t,income:e})),submitLabel:`保存修改`})]}),transfer:(0,F.jsx)(k,{action:l.formAction,accountOptions:e,errorMessage:u,formId:j(`transfer`),hideHeader:!0,hideSubmitButton:!0,initialValues:Ze(o,e),onSubmitDisabledChange:e=>m(t=>({...t,transfer:e})),sourceType:o.type})}),[l.formAction,e,n,a,u,o,s,c]);return(0,F.jsx)(Je,{activeType:d,deleteAction:r,hasLinkedIncomeItems:o.items.some(e=>e.businessStatus?.incomeLinkRole!=null),isSaveConfirmationOpen:l.isConfirmationOpen,isSaveFailureOpen:l.isFailureOpen,isSavePending:l.isPending,onCancelSync:l.cancelConfirmation,onCloseSaveFailure:l.closeFailure,onConfirmSync:l.confirmSync,panels:h,saveErrorMessage:l.state.error,setActiveType:f,submitDisabledByType:p,transactionRecordId:M(o.transactionRecordId)})}function Xe(e,t){return t===e.type?e:{...e,items:[],payments:e.payments.slice(0,1).map(e=>({accountId:e.accountId,amount:null})),type:t}}function Ze(e,t){let n=e.payments[0]?.accountId??``;return{accountId:n,note:e.note,transactionAt:e.transactionAt,transactionRecordId:M(e.transactionRecordId),transferAmount:$e(e.items,t.find(e=>e.id===n)?.currency),transferTargetAccountId:et(t,n),type:`transfer`}}function Qe(e,t){return{items:[],merchantId:``,note:e.note,payments:[{accountId:e.accountId,amount:null}],transactionAt:e.transactionAt,transactionRecordId:e.transactionRecordId,type:t}}function $e(e,t){let n=e.reduce((e,t)=>{let n=Number(t.amount);return Number.isFinite(n)?e+n:e},0);return n<=0?``:String(Number(n.toFixed(p(t))))}function et(e,t){let n=e.find(e=>e.id===t);return e.find(e=>e.id!==t&&e.currency===n?.currency)?.id??``}var F,I,tt,nt,rt,it,at,ot,st,ct,lt=t((()=>{F=r(),I=e(n()),Te(),g(),ee(),ce(),T(),ue(),Se(),pe(),oe(),f(),v(),C(),te(),l(),m(),b(),w(),we(),me(),D(),_e(),je(),Le(),ke(),Ie(),Fe(),ze(),i(),He(),tt=[`expense`,`income`,`transfer`],nt=`delete-transaction-form`,rt={alignItems:`center`,display:`grid`,gridTemplateColumns:`40px minmax(0, 1fr) 40px`,pb:1.5,pt:{xs:0,sm:.5}},it={"@media (hover: hover)":{"&:hover":{bgcolor:`action.hover`}},color:`text.secondary`,justifySelf:`start`},at={color:`text.primary`,fontSize:`1rem`,fontWeight:800,letterSpacing:0,lineHeight:1.25,textAlign:`center`},ot={display:`grid`,gap:1.25,gridTemplateColumns:`minmax(0, 1fr) minmax(0, 2fr)`,mt:Pe.gap},st={...Ne,mt:0},ct={borderRadius:`${s.radius.md}px`,fontSize:`1rem`,fontWeight:800,minHeight:48},We.__docgenInfo={description:``,methods:[],displayName:`NewTransactionTemplate`,props:{accountOptions:{required:!0,tsType:{name:`Array`,elements:[{name:`TransactionAccountOption`}],raw:`TransactionAccountOption[]`},description:``},action:{required:!0,tsType:{name:`TransactionStateAction`},description:``},categoryOptions:{required:!0,tsType:{name:`Array`,elements:[{name:`TransactionCategoryOption`}],raw:`TransactionCategoryOption[]`},description:``},errorMessage:{required:!0,tsType:{name:`union`,raw:`string | null`,elements:[{name:`string`},{name:`null`}]},description:``},frequentCategoryIds:{required:!0,tsType:{name:`Array`,elements:[{name:`string`}],raw:`string[]`},description:``},initialType:{required:!1,tsType:{name:`TransactionRecordType`},description:``},ledgerName:{required:!0,tsType:{name:`string`},description:``},merchantOptions:{required:!0,tsType:{name:`Array`,elements:[{name:`TransactionMerchantOption`}],raw:`TransactionMerchantOption[]`},description:``},refundPickerView:{required:!1,tsType:{name:`TransactionTimeGroupViewData`},description:``},loadRefundGroupItemsAction:{required:!1,tsType:{name:`signature`,type:`function`,raw:`(
  groupKey: string,
  offset: number,
) => Promise<TransactionMonthPage>`,signature:{arguments:[{type:{name:`string`},name:`groupKey`},{type:{name:`number`},name:`offset`}],return:{name:`Promise`,elements:[{name:`TransactionMonthPage`}],raw:`Promise<TransactionMonthPage>`}}},description:``},loadRefundMoreGroupsAction:{required:!1,tsType:{name:`signature`,type:`function`,raw:`(
  offset: number,
) => Promise<TransactionGroupPage>`,signature:{arguments:[{type:{name:`number`},name:`offset`}],return:{name:`Promise`,elements:[{name:`TransactionGroupPage`}],raw:`Promise<TransactionGroupPage>`}}},description:``},loadRefundSearchPageAction:{required:!1,tsType:{name:`signature`,type:`function`,raw:`(
  query: string,
  offset: number,
) => Promise<TransactionSearchPage>`,signature:{arguments:[{type:{name:`string`},name:`query`},{type:{name:`number`},name:`offset`}],return:{name:`Promise`,elements:[{name:`TransactionSearchPage`}],raw:`Promise<TransactionSearchPage>`}}},description:``},transactionItemSpecialStatusEnabled:{required:!0,tsType:{name:`boolean`},description:``}}},N.__docgenInfo={description:``,methods:[],displayName:`TransactionPermissionDenied`,props:{operation:{required:!0,tsType:{name:`union`,raw:`"edit" | "create"`,elements:[{name:`literal`,value:`"edit"`},{name:`literal`,value:`"create"`}]},description:``},reason:{required:!1,tsType:{name:`union`,raw:`"archivedAccount" | "linked" | "permission"`,elements:[{name:`literal`,value:`"archivedAccount"`},{name:`literal`,value:`"linked"`},{name:`literal`,value:`"permission"`}]},description:``,defaultValue:{value:`"permission"`,computed:!1}}}},Ye.__docgenInfo={description:``,methods:[],displayName:`EditTransferTransactionTemplate`,props:{deleteAction:{required:!0,tsType:{name:`TransactionStateAction`},description:``},initialValues:{required:!0,tsType:{name:`TransferEditInitialValues`},description:``}}},P.__docgenInfo={description:``,methods:[],displayName:`EditTransactionTemplate`,props:{deleteAction:{required:!0,tsType:{name:`TransactionStateAction`},description:``},initialValues:{required:!0,tsType:{name:`TransactionFormInitialValues`},description:``}}}}));function ut({children:e}){return(0,dt.jsx)(h,{"data-testid":`transaction-page-frame`,sx:ft,children:e})}var dt,ft,pt=t((()=>{dt=r(),g(),De(),i(),be(),ft={color:`text.primary`,display:`flex`,flexDirection:`column`,isolation:`isolate`,marginInline:`auto`,maxWidth:480,minWidth:0,position:`relative`,px:{xs:1.5,sm:2},pb:{xs:2,sm:3},pt:{xs:1,sm:1.5},width:`100%`,"&::before":{...Oe,content:`""`},"& .MuiToggleButtonGroup-root":{bgcolor:`var(--user-theme-segment-bg)`,border:0,borderRadius:`${s.radius.lg}px`,boxShadow:`none`,gap:0,mb:2,p:.375},"& .MuiToggleButton-root":{border:0,borderRadius:`${s.radius.md}px`,color:`var(--user-theme-segment-text)`,fontSize:`0.875rem`,fontWeight:800,minHeight:34,py:.5},"& .MuiToggleButton-root.Mui-selected":{background:`var(--user-theme-fab-bg)`,boxShadow:`var(--user-theme-card-shadow)`,color:`var(--user-theme-fab-text) !important`},"@media (hover: hover)":{"& .MuiToggleButton-root.Mui-selected:hover":{background:`var(--user-theme-fab-bg)`}},"& .MuiPaper-outlined":{bgcolor:`var(--user-theme-card-bg)`,...ye,borderRadius:`${s.radius.lg}px`,boxShadow:`none`},"& .MuiTextField-root .MuiOutlinedInput-root":{bgcolor:`var(--user-theme-card-bg)`,borderRadius:`${s.radius.md}px`},"& .MuiTextField-root .MuiInputLabel-root":{color:`text.secondary`,fontWeight:700},"& .MuiButton-outlined":{borderColor:`var(--user-theme-field-card-selected-border)`,borderRadius:`${s.radius.md}px`,color:`var(--user-theme-action-text)`,fontWeight:800},"& .MuiButton-contained:not(.Mui-disabled)":{background:`var(--user-theme-fab-bg)`,boxShadow:`0 8px 18px var(--user-theme-fab-shadow)`,color:`var(--user-theme-fab-text)`}},ut.__docgenInfo={description:``,methods:[],displayName:`NewTransactionVisualFrame`,props:{children:{required:!0,tsType:{name:`ReactNode`},description:``}}}}));async function L(){return{}}var R,z,B,mt,ht,gt,V,_t,H,U,W,G,K,q,J,Y,X,Z,Q,$,vt;t((()=>{R=r(),D(),lt(),pt(),{userEvent:z,within:B}=__STORYBOOK_MODULE_TEST__,mt=[{id:`00000000-0000-4000-8000-000000000045`,name:`日元现金`,currency:`JPY`},{id:`00000000-0000-4000-8000-000000000046`,name:`三井住友银行`,currency:`JPY`}],ht=[{id:`00000000-0000-4000-8000-000000005072`,name:`餐饮`,parentId:`00000000-0000-4000-8000-000000005001`,parentName:`食材/调料`,type:`expense`},{id:`00000000-0000-4000-8000-000000005073`,name:`工资`,parentId:`00000000-0000-4000-8000-000000005002`,parentName:`固定收入`,type:`income`}],gt=[{id:`00000000-0000-4000-8000-000000001001`,name:`便利店`,icon_url:null},{id:`00000000-0000-4000-8000-000000001002`,name:`共達`,icon_url:null}],V={accountOptions:mt,action:L,categoryOptions:ht,errorMessage:null,frequentCategoryIds:ht.map(e=>e.id),ledgerName:`家庭账本`,merchantOptions:gt,transactionItemSpecialStatusEnabled:!0},_t={title:`Templates/Transactions/TransactionFormPage`,component:We,decorators:[e=>(0,R.jsx)(ut,{children:(0,R.jsx)(e,{})})],args:V},H={name:`新增记账页面`},U={name:`含错误提示`,args:{errorMessage:`新增记账失败。请稍后重试。`}},W={name:`无新增权限`,render:()=>(0,R.jsx)(N,{operation:`create`})},G={name:`转账账户已归档`,render:()=>(0,R.jsx)(N,{operation:`edit`,reason:`archivedAccount`})},K={name:`无账户和分类选项`,args:{accountOptions:[],categoryOptions:[],merchantOptions:[]}},q={name:`编辑支出：可切换到转账`,render:()=>(0,R.jsx)(P,{...V,deleteAction:L,initialValues:{payments:[{accountId:`00000000-0000-4000-8000-000000000045`,amount:null}],items:[{amount:`1200`,categoryId:`00000000-0000-4000-8000-000000005072`}],merchantId:`00000000-0000-4000-8000-000000001001`,note:`普通交易编辑示例`,transactionAt:`2026-06-05T03:20:10.000Z`,transactionRecordId:`00000000-0000-4000-8000-000000009001`,type:`expense`}})},J={name:`编辑多账户支出（卡 1 + 卡 2）`,render:()=>(0,R.jsx)(P,{...V,deleteAction:L,initialValues:{expectedRecordUpdatedAt:`2026-06-05T03:21:00.000+00:00`,payments:[{accountId:`00000000-0000-4000-8000-000000000045`,amount:`500`},{accountId:`00000000-0000-4000-8000-000000000046`,amount:`700`}],items:[{amount:`1200`,categoryId:`00000000-0000-4000-8000-000000005072`}],merchantId:`00000000-0000-4000-8000-000000001001`,note:`多账户编辑示例`,transactionAt:`2026-06-05T03:20:10.000Z`,transactionRecordId:`00000000-0000-4000-8000-000000009004`,type:`expense`}})},Y={name:`编辑收入：可切换到转账`,render:()=>(0,R.jsx)(P,{...V,deleteAction:L,initialValues:{payments:[{accountId:`00000000-0000-4000-8000-000000000046`,amount:null}],items:[{amount:`260000`,categoryId:`00000000-0000-4000-8000-000000005073`}],merchantId:`00000000-0000-4000-8000-000000001002`,note:`收入交易编辑示例`,transactionAt:`2026-06-05T03:20:10.000Z`,transactionRecordId:`00000000-0000-4000-8000-000000009002`,type:`income`}})},X={name:`编辑记账：转账类型可切换到支出或收入`,render:()=>(0,R.jsx)(Ye,{...V,deleteAction:L,initialValues:{accountId:`00000000-0000-4000-8000-000000000045`,note:`转账编辑示例`,transactionAt:`2026-06-05T03:20:10.000Z`,transactionRecordId:`00000000-0000-4000-8000-000000009003`,transferAmount:`5000`,transferTargetAccountId:`00000000-0000-4000-8000-000000000046`,type:`transfer`}})},Z={name:`编辑已关联支出：可编辑并显示核销结余`,render:()=>(0,R.jsx)(P,{...V,deleteAction:L,initialValues:{payments:[{accountId:`00000000-0000-4000-8000-000000000045`,amount:null}],items:[{amount:`1200`,businessNetAmount:`-300`,businessStatus:{incomeLinkRole:null,offsetComposition:{refundAmount:`0`,reimbursementAmount:`1500`},settlementStatus:`reimbursementSurplus`},categoryId:`00000000-0000-4000-8000-000000005072`,expectedUpdatedAt:`2026-08-21T01:00:00.000Z`,id:`00000000-0000-4000-8000-000000008001`,specialStatus:`reimbursementSurplus`}],merchantId:`00000000-0000-4000-8000-000000001001`,note:`已有关联但仍可修正`,transactionAt:`2026-08-20T03:20:10.000Z`,transactionRecordId:`00000000-0000-4000-8000-000000009004`,type:`expense`}})},Q={name:`删除仍被子项关联的母项被拒绝`,render:()=>(0,R.jsx)(P,{...V,deleteAction:async()=>({error:`该交易包含已关联的退款 / 报销明细，请先解除关联后再删除。`,errorCode:E.linkedDeleteForbidden,errorKey:`storybook-linked-delete-forbidden`}),initialValues:{payments:[{accountId:`00000000-0000-4000-8000-000000000045`,amount:null}],items:[{amount:`1200`,businessStatus:{incomeLinkRole:null,offsetComposition:{refundAmount:`0`,reimbursementAmount:`1200`},settlementStatus:`reimbursed`},categoryId:`00000000-0000-4000-8000-000000005072`,expectedUpdatedAt:`2026-08-21T01:00:00.000Z`,id:`00000000-0000-4000-8000-000000008001`,specialStatus:`reimbursed`}],merchantId:`00000000-0000-4000-8000-000000001001`,note:`删除前需要解除关联`,transactionAt:`2026-08-20T03:20:10.000Z`,transactionRecordId:`00000000-0000-4000-8000-000000009005`,type:`expense`}}),play:async({canvasElement:e})=>{let t=B(e);await z.click(await t.findByRole(`button`,{name:`删除`})),await z.click(await B(document.body).findByRole(`button`,{name:`删除`})),await B(document.body).findByText(`无法删除已关联明细`)}},$={name:`删除关联收入时提示自动解除关联`,render:()=>(0,R.jsx)(P,{...V,deleteAction:L,initialValues:{payments:[{accountId:`00000000-0000-4000-8000-000000000045`,amount:null}],items:[{amount:`1200`,businessStatus:{incomeLinkRole:`reimbursement`,offsetComposition:{refundAmount:`0`,reimbursementAmount:`0`},settlementStatus:null},categoryId:`00000000-0000-4000-8000-000000005073`,expectedUpdatedAt:`2026-08-21T01:00:00.000Z`,id:`00000000-0000-4000-8000-000000008002`,specialStatus:null}],merchantId:`00000000-0000-4000-8000-000000001001`,note:`删除时自动解除关联`,transactionAt:`2026-08-20T03:20:10.000Z`,transactionRecordId:`00000000-0000-4000-8000-000000009006`,type:`income`}}),play:async({canvasElement:e})=>{let t=B(e);await z.click(await t.findByRole(`button`,{name:`删除`})),await B(document.body).findByText(`删除后这笔记账会从明细页移除，并解除退款 / 报销关联，目标支出的核销净额会相应变化。是否继续？`)}},H.parameters={...H.parameters,docs:{...H.parameters?.docs,source:{originalSource:`{
  name: "新增记账页面"
}`,...H.parameters?.docs?.source}}},U.parameters={...U.parameters,docs:{...U.parameters?.docs,source:{originalSource:`{
  name: "含错误提示",
  args: {
    errorMessage: "新增记账失败。请稍后重试。"
  }
}`,...U.parameters?.docs?.source}}},W.parameters={...W.parameters,docs:{...W.parameters?.docs,source:{originalSource:`{
  name: "无新增权限",
  render: () => <TransactionPermissionDenied operation="create" />
}`,...W.parameters?.docs?.source}}},G.parameters={...G.parameters,docs:{...G.parameters?.docs,source:{originalSource:`{
  name: "转账账户已归档",
  render: () => <TransactionPermissionDenied operation="edit" reason="archivedAccount" />
}`,...G.parameters?.docs?.source}}},K.parameters={...K.parameters,docs:{...K.parameters?.docs,source:{originalSource:`{
  name: "无账户和分类选项",
  args: {
    accountOptions: [],
    categoryOptions: [],
    merchantOptions: []
  }
}`,...K.parameters?.docs?.source}}},q.parameters={...q.parameters,docs:{...q.parameters?.docs,source:{originalSource:`{
  name: "编辑支出：可切换到转账",
  render: () => <EditTransactionTemplate {...baseArgs} deleteAction={noopAction} initialValues={{
    payments: [{
      accountId: "00000000-0000-4000-8000-000000000045",
      amount: null
    }],
    items: [{
      amount: "1200",
      categoryId: "00000000-0000-4000-8000-000000005072"
    }],
    merchantId: "00000000-0000-4000-8000-000000001001",
    note: "普通交易编辑示例",
    transactionAt: "2026-06-05T03:20:10.000Z",
    transactionRecordId: "00000000-0000-4000-8000-000000009001",
    type: "expense"
  }} />
}`,...q.parameters?.docs?.source}}},J.parameters={...J.parameters,docs:{...J.parameters?.docs,source:{originalSource:`{
  name: "编辑多账户支出（卡 1 + 卡 2）",
  render: () => <EditTransactionTemplate {...baseArgs} deleteAction={noopAction} initialValues={{
    expectedRecordUpdatedAt: "2026-06-05T03:21:00.000+00:00",
    payments: [{
      accountId: "00000000-0000-4000-8000-000000000045",
      amount: "500"
    }, {
      accountId: "00000000-0000-4000-8000-000000000046",
      amount: "700"
    }],
    items: [{
      amount: "1200",
      categoryId: "00000000-0000-4000-8000-000000005072"
    }],
    merchantId: "00000000-0000-4000-8000-000000001001",
    note: "多账户编辑示例",
    transactionAt: "2026-06-05T03:20:10.000Z",
    transactionRecordId: "00000000-0000-4000-8000-000000009004",
    type: "expense"
  }} />
}`,...J.parameters?.docs?.source}}},Y.parameters={...Y.parameters,docs:{...Y.parameters?.docs,source:{originalSource:`{
  name: "编辑收入：可切换到转账",
  render: () => <EditTransactionTemplate {...baseArgs} deleteAction={noopAction} initialValues={{
    payments: [{
      accountId: "00000000-0000-4000-8000-000000000046",
      amount: null
    }],
    items: [{
      amount: "260000",
      categoryId: "00000000-0000-4000-8000-000000005073"
    }],
    merchantId: "00000000-0000-4000-8000-000000001002",
    note: "收入交易编辑示例",
    transactionAt: "2026-06-05T03:20:10.000Z",
    transactionRecordId: "00000000-0000-4000-8000-000000009002",
    type: "income"
  }} />
}`,...Y.parameters?.docs?.source}}},X.parameters={...X.parameters,docs:{...X.parameters?.docs,source:{originalSource:`{
  name: "编辑记账：转账类型可切换到支出或收入",
  render: () => <EditTransferTransactionTemplate {...baseArgs} deleteAction={noopAction} initialValues={{
    accountId: "00000000-0000-4000-8000-000000000045",
    note: "转账编辑示例",
    transactionAt: "2026-06-05T03:20:10.000Z",
    transactionRecordId: "00000000-0000-4000-8000-000000009003",
    transferAmount: "5000",
    transferTargetAccountId: "00000000-0000-4000-8000-000000000046",
    type: "transfer"
  }} />
}`,...X.parameters?.docs?.source}}},Z.parameters={...Z.parameters,docs:{...Z.parameters?.docs,source:{originalSource:`{
  name: "编辑已关联支出：可编辑并显示核销结余",
  render: () => <EditTransactionTemplate {...baseArgs} deleteAction={noopAction} initialValues={{
    payments: [{
      accountId: "00000000-0000-4000-8000-000000000045",
      amount: null
    }],
    items: [{
      amount: "1200",
      businessNetAmount: "-300",
      businessStatus: {
        incomeLinkRole: null,
        offsetComposition: {
          refundAmount: "0",
          reimbursementAmount: "1500"
        },
        settlementStatus: "reimbursementSurplus"
      },
      categoryId: "00000000-0000-4000-8000-000000005072",
      expectedUpdatedAt: "2026-08-21T01:00:00.000Z",
      id: "00000000-0000-4000-8000-000000008001",
      specialStatus: "reimbursementSurplus"
    }],
    merchantId: "00000000-0000-4000-8000-000000001001",
    note: "已有关联但仍可修正",
    transactionAt: "2026-08-20T03:20:10.000Z",
    transactionRecordId: "00000000-0000-4000-8000-000000009004",
    type: "expense"
  }} />
}`,...Z.parameters?.docs?.source}}},Q.parameters={...Q.parameters,docs:{...Q.parameters?.docs,source:{originalSource:`{
  name: "删除仍被子项关联的母项被拒绝",
  render: () => <EditTransactionTemplate {...baseArgs} deleteAction={async () => ({
    error: "该交易包含已关联的退款 / 报销明细，请先解除关联后再删除。",
    errorCode: transactionErrorCodes.linkedDeleteForbidden,
    errorKey: "storybook-linked-delete-forbidden"
  })} initialValues={{
    payments: [{
      accountId: "00000000-0000-4000-8000-000000000045",
      amount: null
    }],
    items: [{
      amount: "1200",
      businessStatus: {
        incomeLinkRole: null,
        offsetComposition: {
          refundAmount: "0",
          reimbursementAmount: "1200"
        },
        settlementStatus: "reimbursed"
      },
      categoryId: "00000000-0000-4000-8000-000000005072",
      expectedUpdatedAt: "2026-08-21T01:00:00.000Z",
      id: "00000000-0000-4000-8000-000000008001",
      specialStatus: "reimbursed"
    }],
    merchantId: "00000000-0000-4000-8000-000000001001",
    note: "删除前需要解除关联",
    transactionAt: "2026-08-20T03:20:10.000Z",
    transactionRecordId: "00000000-0000-4000-8000-000000009005",
    type: "expense"
  }} />,
  play: async ({
    canvasElement
  }) => {
    const canvas = within(canvasElement);
    await userEvent.click(await canvas.findByRole("button", {
      name: "删除"
    }));
    await userEvent.click(await within(document.body).findByRole("button", {
      name: "删除"
    }));
    await within(document.body).findByText("无法删除已关联明细");
  }
}`,...Q.parameters?.docs?.source}}},$.parameters={...$.parameters,docs:{...$.parameters?.docs,source:{originalSource:`{
  name: "删除关联收入时提示自动解除关联",
  render: () => <EditTransactionTemplate {...baseArgs} deleteAction={noopAction} initialValues={{
    payments: [{
      accountId: "00000000-0000-4000-8000-000000000045",
      amount: null
    }],
    items: [{
      amount: "1200",
      businessStatus: {
        incomeLinkRole: "reimbursement",
        offsetComposition: {
          refundAmount: "0",
          reimbursementAmount: "0"
        },
        settlementStatus: null
      },
      categoryId: "00000000-0000-4000-8000-000000005073",
      expectedUpdatedAt: "2026-08-21T01:00:00.000Z",
      id: "00000000-0000-4000-8000-000000008002",
      specialStatus: null
    }],
    merchantId: "00000000-0000-4000-8000-000000001001",
    note: "删除时自动解除关联",
    transactionAt: "2026-08-20T03:20:10.000Z",
    transactionRecordId: "00000000-0000-4000-8000-000000009006",
    type: "income"
  }} />,
  play: async ({
    canvasElement
  }) => {
    const canvas = within(canvasElement);
    await userEvent.click(await canvas.findByRole("button", {
      name: "删除"
    }));
    await within(document.body).findByText("删除后这笔记账会从明细页移除，并解除退款 / 报销关联，目标支出的核销净额会相应变化。是否继续？");
  }
}`,...$.parameters?.docs?.source}}},vt=[`Default`,`WithError`,`PermissionDenied`,`ArchivedAccountPermissionDenied`,`EmptyOptions`,`EditExpenseConvert`,`EditMultiAccountExpense`,`EditIncomeConvert`,`EditTransferConvert`,`EditLinkedExpense`,`LinkedDeleteForbidden`,`LinkedIncomeDeleteConfirmation`]}))();export{G as ArchivedAccountPermissionDenied,H as Default,q as EditExpenseConvert,Y as EditIncomeConvert,Z as EditLinkedExpense,J as EditMultiAccountExpense,X as EditTransferConvert,K as EmptyOptions,Q as LinkedDeleteForbidden,$ as LinkedIncomeDeleteConfirmation,W as PermissionDenied,U as WithError,vt as __namedExportsOrder,_t as default};