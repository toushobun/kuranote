import{c as e,i as t}from"./preload-helper-D2yxXLVK.js";import{t as n}from"./react-DAMDAfNa.js";import{t as r}from"./jsx-runtime-Dwpk6tgA.js";import{_ as i,a,d as o,g as s,m as c,s as l,u}from"./iframe-B_AM_8tq.js";import{n as d,t as f}from"./Stack-Blj2xom2.js";import{i as p,s as m}from"./transactionAmountInput-BaIP6MYU.js";import{n as h,t as g}from"./Box-D4rJChY4.js";import{n as _,t as v}from"./Typography-CWKirwdW.js";import{i as y,t as b}from"./transactionMessages-CwEsGhgZ.js";import{n as x,t as S}from"./Button-BUz5fAjB.js";import{n as ee,t as te}from"./link-Du4AGLbo.js";import{n as ne,t as re}from"./PrimaryActionButton-DRO_Xbdt.js";import{a as ie,c as ae,i as oe}from"./OperationFeedbackDialogs-CE-pm278.js";import{n as se,t as C}from"./IconButton-kkjlPZ_P.js";import{n as ce,o as le,s as ue,t as de}from"./DialogContent-BxqGx8le.js";import{n as fe,t as pe}from"./DialogActions-BOHXclwd.js";import{n as me,t as he}from"./DialogTitle-LOB3eFRh.js";import{n as ge,t as _e}from"./bottomNavigationLayout-DjPnOv_2.js";import{E as ve,T as w,t as ye}from"./transaction-RfR9-NDe.js";import{n as be,t as xe}from"./TransactionTypeNavigation-emvDChQn.js";import{r as Se,t as Ce}from"./userThemeCardSx-vnoApgu-.js";import{n as we,t as Te}from"./DialogContentText-CvPgR_43.js";import{n as Ee,r as De}from"./ErrorState-CoiroFJD.js";import{n as Oe,t as ke}from"./ArrowBackRounded-CpnRt5D2.js";import{n as Ae,t as je}from"./fullViewportPageBackgroundSx-BEsR-Htf.js";import{n as Me,t as Ne}from"./TransactionEditRestrictionAlert-D8n6U_Bf.js";import{n as Pe,t as Fe}from"./LinkedTransactionSyncConfirmationDialog-BrYsOsht.js";import{i as Ie,t as Le}from"./TransactionAmountKeypadLauncher-CyW-p7Eb.js";import{o as Re,r as ze,t as Be}from"./TransactionForm.styles-CXHxW6j8.js";import{n as Ve,t as T}from"./TransactionForm-DfbDcw3j.js";import{n as He,t as Ue}from"./EditTransactionDirtyContext-CaDsW0-5.js";import{n as We,t as Ge}from"./TransferTransactionForm-BaLlgw3j.js";function Ke(e){let t=new FormData;for(let[n,r]of e.entries())t.append(n,r);return t}function qe(e){let t=(0,E.useRef)(null),[n,r]=(0,E.useState)(null),[i,a,o]=(0,E.useActionState)((0,E.useCallback)(async(n,r)=>{let i=await e(n,r);return i.errorCode===w.linkedSyncConfirmationRequired&&(t.current=Ke(r)),i},[e]),{}),s=!!(i!==n&&i.error&&i.errorCode===w.linkedSyncConfirmationRequired),c=!!(i!==n&&i.error&&i.errorCode!==w.linkedSyncConfirmationRequired);function l(){t.current=null,r(i)}function u(){let e=t.current;e&&(e.set(`confirmSync`,`true`),t.current=null,r(i),(0,E.startTransition)(()=>a(e)))}return{cancelConfirmation:l,closeFailure:()=>r(i),confirmSync:u,formAction:a,isConfirmationOpen:s,isFailureOpen:c,isPending:o,state:i}}var E,Je=t((()=>{E=e(n()),ye()}));function D(e){return`edit-${e}-transaction-form`}function Ye(e){if(!e)throw Error(`transactionRecordId is required for edit transaction.`);return e}function Xe({activeType:e,panels:t}){let n=(0,A.useRef)(null),r=(0,A.useRef)(null),i=(0,A.useRef)(null),[a,o]=(0,A.useState)(null),s=lt.indexOf(e);return(0,A.useLayoutEffect)(()=>{function t(){return e===`expense`?n.current:e===`income`?r.current:i.current}let a=t();if(!a)return;function s(){let e=t();e&&o(e.getBoundingClientRect().height)}if(s(),typeof ResizeObserver>`u`)return;let c=new ResizeObserver(s);return c.observe(a),()=>{c.disconnect()}},[e]),(0,k.jsx)(h,{"data-testid":`transaction-type-slide-panels`,sx:e=>({height:a??`auto`,overflow:`hidden`,transition:e.transitions.create(`height`,{duration:e.transitions.duration.shorter,easing:e.transitions.easing.easeInOut}),width:`100%`}),children:(0,k.jsx)(h,{sx:e=>({alignItems:`flex-start`,display:`flex`,transform:`translateX(-${s*100}%)`,transition:e.transitions.create(`transform`,{duration:e.transitions.duration.shorter,easing:e.transitions.easing.easeInOut}),width:`100%`}),children:lt.map(a=>(0,k.jsx)(h,{ref:a===`expense`?n:a===`income`?r:i,"aria-hidden":a!==e,"data-testid":`transaction-type-slide-panel-${a}`,inert:a===e?void 0:!0,sx:{flex:`0 0 100%`},children:t[a]},a))})})}function Ze(e){return(0,k.jsxs)(k.Fragment,{children:[(0,k.jsx)(et,{...e}),(0,k.jsx)(Le,{})]})}function Qe(){return(0,k.jsxs)(d,{spacing:2,children:[(0,k.jsx)(tt,{title:`新增记账`}),(0,k.jsx)(Ee,{title:`无法新增记账`,description:`当前账本角色没有新增记账的权限。`,action:(0,k.jsx)(x,{component:ee,href:o.transactions,variant:`outlined`,children:`返回明细`})})]})}function $e(e){let t=c(e);return{account:a(t),merchant:u(t)}}function et({accountOptions:e,action:t,categoryOptions:n,errorMessage:r,frequentCategoryIds:i,initialType:o,merchantOptions:s,refundPickerView:l,loadRefundGroupItemsAction:u,loadRefundMoreGroupsAction:f,loadRefundSearchPageAction:p,multiAccountPaymentEnabled:m,transactionItemSpecialStatusEnabled:h}){let[g,_]=(0,A.useActionState)(t,{}),v=g.error??r,[y,b]=(0,A.useState)(o??`expense`),x=(0,A.useRef)(o===`income`?`income`:`expense`),[,S]=(0,A.useState)({expense:!0,income:!0,transfer:!0});(0,A.useEffect)(()=>{y!==`transfer`&&(x.current=y)},[y]);function ee(e){if(e===`normal`){b(x.current);return}b(`transfer`)}let te=(0,A.useMemo)(()=>({expense:(0,k.jsx)(T,{action:_,accountOptions:e,categoryOptions:n,errorMessage:v,frequentCategoryIds:i,formId:`new-expense-transaction-form`,hideHeader:!0,initialType:`expense`,merchantOptions:s,refundPickerView:l,loadRefundGroupItemsAction:u,loadRefundMoreGroupsAction:f,loadRefundSearchPageAction:p,setupHrefs:$e(`expense`),multiAccountPaymentEnabled:m,transactionItemSpecialStatusEnabled:h,onSubmitDisabledChange:e=>S(t=>({...t,expense:e}))}),income:(0,k.jsx)(T,{action:_,accountOptions:e,categoryOptions:n,errorMessage:v,frequentCategoryIds:i,formId:`new-income-transaction-form`,hideHeader:!0,initialType:`income`,merchantOptions:s,refundPickerView:l,loadRefundGroupItemsAction:u,loadRefundMoreGroupsAction:f,loadRefundSearchPageAction:p,setupHrefs:$e(`income`),multiAccountPaymentEnabled:m,transactionItemSpecialStatusEnabled:h,onSubmitDisabledChange:e=>S(t=>({...t,income:e}))}),transfer:(0,k.jsx)(Ge,{action:_,accountOptions:e,addAccountHref:a(c(`transfer`)),errorMessage:v,formId:`new-transfer-transaction-form`,hideHeader:!0,onSubmitDisabledChange:e=>S(t=>({...t,transfer:e}))})}),[_,e,n,i,v,s,l,u,f,p,m,h]);return(0,k.jsxs)(d,{spacing:0,children:[(0,k.jsx)(tt,{title:`记一笔`}),(0,k.jsx)(xe,{activeType:y===`transfer`?`transfer`:`normal`,onChange:ee}),(0,k.jsx)(Xe,{activeType:y,panels:te})]})}function tt({hasUnsavedChanges:e=!1,onClose:t,title:n}){return(0,k.jsxs)(h,{sx:dt,children:[e&&t?(0,k.jsx)(se,{"aria-label":`关闭`,onClick:t,sx:ft,children:(0,k.jsx)(ke,{})}):(0,k.jsx)(se,{"aria-label":`关闭`,component:ee,href:o.transactions,sx:ft,children:(0,k.jsx)(ke,{})}),(0,k.jsx)(_,{component:`h1`,variant:`h5`,sx:pt,children:n}),(0,k.jsx)(h,{"aria-hidden":!0,sx:{width:40}})]})}function nt({activeType:e,canDelete:t,deleteAction:n,editRestriction:r,hasLinkedIncomeItems:i,isSaveConfirmationOpen:a,isSaveFailureOpen:s,isSavePending:c,onCancelSync:l,onCloseSaveFailure:u,onConfirmSync:f,panels:p,saveErrorMessage:m,setActiveType:g,submitDisabledByType:_,transactionRecordId:v}){let b=r!==null,[S,te]=(0,A.useActionState)(n,{}),[ne,ae]=(0,A.useState)(!1),[se,C]=(0,A.useState)(!1),[le,de]=(0,A.useState)(!1),[pe,he]=(0,A.useState)(S),ge=(0,A.useRef)(e===`transfer`?`expense`:e),ye=e===`transfer`?`transfer`:`normal`,be=(0,A.useCallback)(()=>ae(!0),[]);(0,A.useEffect)(()=>{e!==`transfer`&&(ge.current=e)},[e]),(0,A.useEffect)(()=>{if(!ne)return;function e(e){e.preventDefault(),e.returnValue=``}return window.addEventListener(`beforeunload`,e),()=>window.removeEventListener(`beforeunload`,e)},[ne]);function Se(e){be(),g(e===`transfer`?`transfer`:ge.current)}function Ce(){let t=document.getElementById(D(e))?.closest(`form`);t instanceof HTMLFormElement&&(C(!1),t.requestSubmit())}function Te(){let e=document.getElementById(ut);e instanceof HTMLFormElement&&(de(!1),e.requestSubmit())}return(0,k.jsxs)(Ue,{onDirty:be,children:[(0,k.jsxs)(d,{onChangeCapture:be,spacing:0,children:[(0,k.jsx)(tt,{hasUnsavedChanges:ne,onClose:()=>C(!0),title:b?y.pageTitle:`编辑记账`}),r?(0,k.jsx)(h,{sx:gt,children:(0,k.jsx)(Ne,{reason:r})}):null,(0,k.jsx)(xe,{activeType:ye,disabled:b,onChange:Se}),(0,k.jsx)(Xe,{activeType:e,panels:p}),t||!b?(0,k.jsxs)(h,{sx:[mt,b&&ht],children:[t?(0,k.jsx)(x,{color:`error`,onClick:()=>de(!0),size:`large`,variant:`outlined`,sx:vt,children:`删除`}):null,b?null:(0,k.jsx)(re,{disabled:_[e]||c,form:D(e),size:`large`,type:`submit`,sx:_t,children:`保存修改`})]}):null]}),(0,k.jsx)(`form`,{action:te,id:ut,children:(0,k.jsx)(`input`,{name:`transactionRecordId`,readOnly:!0,type:`hidden`,value:v})}),b?null:(0,k.jsx)(Le,{}),(0,k.jsxs)(ue,{"aria-labelledby":`unsaved-transaction-dialog-title`,onClose:()=>C(!1),open:se,children:[(0,k.jsx)(me,{id:`unsaved-transaction-dialog-title`,children:`尚未保存`}),(0,k.jsx)(ce,{children:(0,k.jsx)(we,{children:`修正的内容尚未保存，是否保存？`})}),(0,k.jsxs)(fe,{children:[(0,k.jsx)(x,{onClick:()=>C(!1),children:`继续编辑`}),(0,k.jsx)(x,{component:ee,href:o.transactions,color:`error`,children:`放弃修改`}),(0,k.jsx)(x,{onClick:Ce,variant:`contained`,children:`保存`})]})]}),(0,k.jsx)(oe,{description:i?`删除后这笔记账会从明细页移除，并解除退款 / 报销关联，目标支出的核销净额会相应变化。是否继续？`:`删除后这笔记账会从明细页移除，是否继续？`,onCancel:()=>de(!1),onConfirm:Te,open:le,title:`删除记账？`}),(0,k.jsx)(Fe,{onCancel:()=>{ae(!0),l()},onConfirm:f,open:a}),(0,k.jsx)(ie,{bottomOffset:_e.feedbackBottomOffset,description:m,onClose:()=>{ae(!0),u()},open:s,title:`保存失败`}),(0,k.jsx)(ie,{bottomOffset:_e.feedbackBottomOffset,description:S.error,onClose:()=>he(S),open:!!(S.error&&S!==pe),title:S.errorCode===w.linkedDeleteForbidden?ve.deleteForbidden:`删除失败`})]})}function rt({accountOptions:e,action:t,canDelete:n,categoryOptions:r,deleteAction:i,editRestriction:a,errorMessage:o,frequentCategoryIds:s,initialValues:c,merchantOptions:l,multiAccountPaymentEnabled:u,transactionItemSpecialStatusEnabled:d}){let f=qe(t),p=o,m=a!==null,[h,g]=(0,A.useState)(`transfer`),[_,v]=(0,A.useState)({expense:!0,income:!0,transfer:!0}),y=(0,A.useMemo)(()=>({expense:(0,k.jsxs)(k.Fragment,{children:[(0,k.jsx)(`input`,{form:D(`expense`),name:`sourceType`,readOnly:!0,type:`hidden`,value:`transfer`}),(0,k.jsx)(T,{action:f.formAction,accountOptions:e,categoryOptions:r,errorMessage:p,frequentCategoryIds:s,formId:D(`expense`),hideHeader:!0,hideSubmitButton:!0,initialValues:ot(c,`expense`),merchantOptions:l,multiAccountPaymentEnabled:u,transactionItemSpecialStatusEnabled:d,onSubmitDisabledChange:e=>v(t=>({...t,expense:e})),readOnly:m,submitLabel:`保存修改`})]}),income:(0,k.jsxs)(k.Fragment,{children:[(0,k.jsx)(`input`,{form:D(`income`),name:`sourceType`,readOnly:!0,type:`hidden`,value:`transfer`}),(0,k.jsx)(T,{action:f.formAction,accountOptions:e,categoryOptions:r,errorMessage:p,frequentCategoryIds:s,formId:D(`income`),hideHeader:!0,hideSubmitButton:!0,initialValues:ot(c,`income`),merchantOptions:l,multiAccountPaymentEnabled:u,transactionItemSpecialStatusEnabled:d,onSubmitDisabledChange:e=>v(t=>({...t,income:e})),readOnly:m,submitLabel:`保存修改`})]}),transfer:(0,k.jsx)(Ge,{action:f.formAction,accountOptions:e,errorMessage:p,formId:D(`transfer`),hideHeader:!0,hideSubmitButton:!0,initialValues:c,onSubmitDisabledChange:e=>v(t=>({...t,transfer:e})),readOnly:m,sourceType:`transfer`})}),[f.formAction,e,r,s,p,c,l,u,m,d]);return(0,k.jsx)(nt,{activeType:h,canDelete:n,deleteAction:i,editRestriction:a,hasLinkedIncomeItems:!1,isSaveConfirmationOpen:f.isConfirmationOpen,isSaveFailureOpen:f.isFailureOpen,isSavePending:f.isPending,onCancelSync:f.cancelConfirmation,onCloseSaveFailure:f.closeFailure,onConfirmSync:f.confirmSync,panels:y,saveErrorMessage:f.state.error,setActiveType:g,submitDisabledByType:_,transactionRecordId:Ye(c.transactionRecordId)})}function O({accountOptions:e,action:t,canDelete:n,categoryOptions:r,deleteAction:i,editRestriction:a,errorMessage:o,frequentCategoryIds:s,initialValues:c,merchantOptions:l,multiAccountPaymentEnabled:u,transactionItemSpecialStatusEnabled:d}){let f=qe(t),p=o,m=a!==null,[h,g]=(0,A.useState)(c.type),[_,v]=(0,A.useState)({expense:!0,income:!0,transfer:!0}),y=(0,A.useMemo)(()=>({expense:(0,k.jsxs)(k.Fragment,{children:[(0,k.jsx)(`input`,{form:D(`expense`),name:`sourceType`,readOnly:!0,type:`hidden`,value:c.type}),(0,k.jsx)(T,{action:f.formAction,accountOptions:e,categoryOptions:r,errorMessage:p,frequentCategoryIds:s,formId:D(`expense`),hideHeader:!0,hideSubmitButton:!0,initialValues:it(c,`expense`),merchantOptions:l,multiAccountPaymentEnabled:u,transactionItemSpecialStatusEnabled:d,onSubmitDisabledChange:e=>v(t=>({...t,expense:e})),readOnly:m,submitLabel:`保存修改`})]}),income:(0,k.jsxs)(k.Fragment,{children:[(0,k.jsx)(`input`,{form:D(`income`),name:`sourceType`,readOnly:!0,type:`hidden`,value:c.type}),(0,k.jsx)(T,{action:f.formAction,accountOptions:e,categoryOptions:r,errorMessage:p,frequentCategoryIds:s,formId:D(`income`),hideHeader:!0,hideSubmitButton:!0,initialValues:it(c,`income`),merchantOptions:l,multiAccountPaymentEnabled:u,transactionItemSpecialStatusEnabled:d,onSubmitDisabledChange:e=>v(t=>({...t,income:e})),readOnly:m,submitLabel:`保存修改`})]}),transfer:(0,k.jsx)(Ge,{action:f.formAction,accountOptions:e,errorMessage:p,formId:D(`transfer`),hideHeader:!0,hideSubmitButton:!0,initialValues:at(c,e),onSubmitDisabledChange:e=>v(t=>({...t,transfer:e})),readOnly:m,sourceType:c.type})}),[f.formAction,e,r,s,p,c,l,u,m,d]);return(0,k.jsx)(nt,{activeType:h,canDelete:n,deleteAction:i,editRestriction:a,hasLinkedIncomeItems:c.items.some(e=>e.businessStatus?.incomeLinkRole!=null),isSaveConfirmationOpen:f.isConfirmationOpen,isSaveFailureOpen:f.isFailureOpen,isSavePending:f.isPending,onCancelSync:f.cancelConfirmation,onCloseSaveFailure:f.closeFailure,onConfirmSync:f.confirmSync,panels:y,saveErrorMessage:f.state.error,setActiveType:g,submitDisabledByType:_,transactionRecordId:Ye(c.transactionRecordId)})}function it(e,t){return t===e.type?e:{...e,items:[],payments:e.payments.slice(0,1).map(e=>({accountId:e.accountId,amount:null})),type:t}}function at(e,t){let n=e.payments[0]?.accountId??``;return{accountId:n,note:e.note,transactionAt:e.transactionAt,transactionRecordId:Ye(e.transactionRecordId),transferAmount:st(e.items,t.find(e=>e.id===n)?.currency),transferTargetAccountId:ct(t,n),type:`transfer`}}function ot(e,t){return{items:[],merchantId:``,note:e.note,payments:[{accountId:e.accountId,amount:null}],transactionAt:e.transactionAt,transactionRecordId:e.transactionRecordId,type:t}}function st(e,t){let n=e.reduce((e,t)=>{let n=Number(t.amount);return Number.isFinite(n)?e+n:e},0);return n<=0?``:String(Number(n.toFixed(p(t))))}function ct(e,t){let n=e.find(e=>e.id===t);return e.find(e=>e.id!==t&&e.currency===n?.currency)?.id??``}var k,A,lt,ut,dt,ft,pt,mt,ht,gt,_t,vt,yt=t((()=>{k=r(),A=e(n()),Oe(),g(),S(),le(),pe(),de(),Te(),he(),C(),f(),v(),te(),ne(),l(),m(),b(),ae(),De(),Me(),ge(),ye(),be(),Ie(),He(),Pe(),Ve(),Be(),We(),i(),Je(),lt=[`expense`,`income`,`transfer`],ut=`delete-transaction-form`,dt={alignItems:`center`,display:`grid`,gridTemplateColumns:`40px minmax(0, 1fr) 40px`,pb:1.5,pt:{xs:0,sm:.5}},ft={"@media (hover: hover)":{"&:hover":{bgcolor:`action.hover`}},color:`text.secondary`,justifySelf:`start`},pt={color:`text.primary`,fontSize:`1rem`,fontWeight:800,letterSpacing:0,lineHeight:1.25,textAlign:`center`},mt={display:`grid`,gap:1.25,gridTemplateColumns:`minmax(0, 1fr) minmax(0, 2fr)`,mt:ze.gap},ht={gridTemplateColumns:`minmax(0, 1fr)`},gt={pb:1.5},_t={...Re,mt:0},vt={borderRadius:`${s.radius.md}px`,fontSize:`1rem`,fontWeight:800,minHeight:48},Ze.__docgenInfo={description:``,methods:[],displayName:`NewTransactionTemplate`,props:{accountOptions:{required:!0,tsType:{name:`Array`,elements:[{name:`TransactionAccountOption`}],raw:`TransactionAccountOption[]`},description:``},action:{required:!0,tsType:{name:`TransactionStateAction`},description:``},categoryOptions:{required:!0,tsType:{name:`Array`,elements:[{name:`TransactionCategoryOption`}],raw:`TransactionCategoryOption[]`},description:``},errorMessage:{required:!0,tsType:{name:`union`,raw:`string | null`,elements:[{name:`string`},{name:`null`}]},description:``},frequentCategoryIds:{required:!0,tsType:{name:`Array`,elements:[{name:`string`}],raw:`string[]`},description:``},initialType:{required:!1,tsType:{name:`TransactionRecordType`},description:``},ledgerName:{required:!0,tsType:{name:`string`},description:``},merchantOptions:{required:!0,tsType:{name:`Array`,elements:[{name:`TransactionMerchantOption`}],raw:`TransactionMerchantOption[]`},description:``},refundPickerView:{required:!1,tsType:{name:`TransactionTimeGroupViewData`},description:``},loadRefundGroupItemsAction:{required:!1,tsType:{name:`signature`,type:`function`,raw:`(
  groupKey: string,
  offset: number,
) => Promise<TransactionMonthPage>`,signature:{arguments:[{type:{name:`string`},name:`groupKey`},{type:{name:`number`},name:`offset`}],return:{name:`Promise`,elements:[{name:`TransactionMonthPage`}],raw:`Promise<TransactionMonthPage>`}}},description:``},loadRefundMoreGroupsAction:{required:!1,tsType:{name:`signature`,type:`function`,raw:`(
  offset: number,
) => Promise<TransactionGroupPage>`,signature:{arguments:[{type:{name:`number`},name:`offset`}],return:{name:`Promise`,elements:[{name:`TransactionGroupPage`}],raw:`Promise<TransactionGroupPage>`}}},description:``},loadRefundSearchPageAction:{required:!1,tsType:{name:`signature`,type:`function`,raw:`(
  query: string,
  offset: number,
) => Promise<TransactionSearchPage>`,signature:{arguments:[{type:{name:`string`},name:`query`},{type:{name:`number`},name:`offset`}],return:{name:`Promise`,elements:[{name:`TransactionSearchPage`}],raw:`Promise<TransactionSearchPage>`}}},description:``},multiAccountPaymentEnabled:{required:!0,tsType:{name:`boolean`},description:``},transactionItemSpecialStatusEnabled:{required:!0,tsType:{name:`boolean`},description:``}}},Qe.__docgenInfo={description:``,methods:[],displayName:`TransactionPermissionDenied`},rt.__docgenInfo={description:``,methods:[],displayName:`EditTransferTransactionTemplate`,props:{canDelete:{required:!0,tsType:{name:`boolean`},description:``},deleteAction:{required:!0,tsType:{name:`TransactionStateAction`},description:``},editRestriction:{required:!0,tsType:{name:`union`,raw:`TransactionEditRestriction | null`,elements:[{name:`TransactionEditRestriction`},{name:`null`}]},description:`有限制时显示只读详情（#928）：表单整体禁用，不显示保存。`},initialValues:{required:!0,tsType:{name:`TransferEditInitialValues`},description:``}}},O.__docgenInfo={description:``,methods:[],displayName:`EditTransactionTemplate`,props:{canDelete:{required:!0,tsType:{name:`boolean`},description:``},deleteAction:{required:!0,tsType:{name:`TransactionStateAction`},description:``},editRestriction:{required:!0,tsType:{name:`union`,raw:`TransactionEditRestriction | null`,elements:[{name:`TransactionEditRestriction`},{name:`null`}]},description:`有限制时显示只读详情（#928）：表单整体禁用，不显示保存。`},initialValues:{required:!0,tsType:{name:`TransactionFormInitialValues`},description:``}}}}));function bt({children:e}){return(0,xt.jsx)(h,{"data-testid":`transaction-page-frame`,sx:St,children:e})}var xt,St,Ct=t((()=>{xt=r(),g(),Ae(),i(),Ce(),St={color:`text.primary`,display:`flex`,flexDirection:`column`,isolation:`isolate`,marginInline:`auto`,maxWidth:480,minWidth:0,position:`relative`,px:{xs:1.5,sm:2},pb:{xs:2,sm:3},pt:{xs:1,sm:1.5},width:`100%`,"&::before":{...je,content:`""`},"& .MuiToggleButtonGroup-root":{bgcolor:`var(--user-theme-segment-bg)`,border:0,borderRadius:`${s.radius.lg}px`,boxShadow:`none`,gap:0,mb:2,p:.375},"& .MuiToggleButton-root":{border:0,borderRadius:`${s.radius.md}px`,color:`var(--user-theme-segment-text)`,fontSize:`0.875rem`,fontWeight:800,minHeight:34,py:.5},"& .MuiToggleButton-root.Mui-selected":{background:`var(--user-theme-fab-bg)`,boxShadow:`var(--user-theme-card-shadow)`,color:`var(--user-theme-fab-text) !important`},"@media (hover: hover)":{"& .MuiToggleButton-root.Mui-selected:hover":{background:`var(--user-theme-fab-bg)`}},"& .MuiPaper-outlined":{bgcolor:`var(--user-theme-card-bg)`,...Se,borderRadius:`${s.radius.lg}px`,boxShadow:`none`},"& .MuiTextField-root .MuiOutlinedInput-root":{bgcolor:`var(--user-theme-card-bg)`,borderRadius:`${s.radius.md}px`},"& .MuiTextField-root .MuiInputLabel-root":{color:`text.secondary`,fontWeight:700},"& .MuiButton-outlined":{borderColor:`var(--user-theme-field-card-selected-border)`,borderRadius:`${s.radius.md}px`,color:`var(--user-theme-action-text)`,fontWeight:800},"& .MuiButton-contained:not(.Mui-disabled)":{background:`var(--user-theme-fab-bg)`,boxShadow:`0 8px 18px var(--user-theme-fab-shadow)`,color:`var(--user-theme-fab-text)`}},bt.__docgenInfo={description:``,methods:[],displayName:`NewTransactionVisualFrame`,props:{children:{required:!0,tsType:{name:`ReactNode`},description:``}}}}));async function wt(){return{}}var j,M,N,Tt,Et,Dt,Ot,P,F,kt,I,At,L,R,z,B,V,H,U,W,G,K,q,J,Y,X,Z,Q,$,jt;t((()=>{j=r(),ye(),yt(),Ct(),{userEvent:M,within:N}=__STORYBOOK_MODULE_TEST__,Tt=[{id:`00000000-0000-4000-8000-000000000045`,name:`日元现金`,currency:`JPY`},{id:`00000000-0000-4000-8000-000000000046`,name:`三井住友银行`,currency:`JPY`}],Et=[{id:`00000000-0000-4000-8000-000000005072`,name:`餐饮`,parentId:`00000000-0000-4000-8000-000000005001`,parentName:`食材/调料`,type:`expense`},{id:`00000000-0000-4000-8000-000000005073`,name:`工资`,parentId:`00000000-0000-4000-8000-000000005002`,parentName:`固定收入`,type:`income`}],Dt=[{id:`00000000-0000-4000-8000-000000001001`,name:`便利店`,icon_url:null},{id:`00000000-0000-4000-8000-000000001002`,name:`共達`,icon_url:null}],Ot={accountOptions:Tt,action:wt,categoryOptions:Et,errorMessage:null,frequentCategoryIds:Et.map(e=>e.id),ledgerName:`家庭账本`,merchantOptions:Dt,multiAccountPaymentEnabled:!0,transactionItemSpecialStatusEnabled:!0},P={...Ot,canDelete:!0,deleteAction:wt,editRestriction:null},F={payments:[{accountId:`00000000-0000-4000-8000-000000000045`,amount:null}],items:[{amount:`1200`,categoryId:`00000000-0000-4000-8000-000000005072`}],merchantId:`00000000-0000-4000-8000-000000001001`,note:`普通交易编辑示例`,transactionAt:`2026-06-05T03:20:10.000Z`,transactionRecordId:`00000000-0000-4000-8000-000000009001`,type:`expense`},kt={expectedRecordUpdatedAt:`2026-06-05T03:21:00.000+00:00`,payments:[{accountId:`00000000-0000-4000-8000-000000000045`,amount:`500`},{accountId:`00000000-0000-4000-8000-000000000046`,amount:`700`}],items:[{amount:`1200`,categoryId:`00000000-0000-4000-8000-000000005072`}],merchantId:`00000000-0000-4000-8000-000000001001`,note:`多账户编辑示例`,transactionAt:`2026-06-05T03:20:10.000Z`,transactionRecordId:`00000000-0000-4000-8000-000000009004`,type:`expense`},I={accountId:`00000000-0000-4000-8000-000000000045`,note:`转账编辑示例`,transactionAt:`2026-06-05T03:20:10.000Z`,transactionRecordId:`00000000-0000-4000-8000-000000009003`,transferAmount:`5000`,transferTargetAccountId:`00000000-0000-4000-8000-000000000046`,type:`transfer`},At={title:`Templates/Transactions/TransactionFormPage`,component:Ze,decorators:[e=>(0,j.jsx)(bt,{children:(0,j.jsx)(e,{})})],args:Ot},L={name:`新增记账页面`},R={name:`含错误提示`,args:{errorMessage:`新增记账失败。请稍后重试。`}},z={name:`无新增权限`,render:()=>(0,j.jsx)(Qe,{})},B={name:`无账户和分类选项`,args:{accountOptions:[],categoryOptions:[],merchantOptions:[]}},V={name:`编辑支出：可切换到转账`,render:()=>(0,j.jsx)(O,{...P,initialValues:F})},H={name:`编辑多账户支出（卡 1 + 卡 2）`,render:()=>(0,j.jsx)(O,{...P,initialValues:kt})},U={name:`编辑收入：可切换到转账`,render:()=>(0,j.jsx)(O,{...P,initialValues:{payments:[{accountId:`00000000-0000-4000-8000-000000000046`,amount:null}],items:[{amount:`260000`,categoryId:`00000000-0000-4000-8000-000000005073`}],merchantId:`00000000-0000-4000-8000-000000001002`,note:`收入交易编辑示例`,transactionAt:`2026-06-05T03:20:10.000Z`,transactionRecordId:`00000000-0000-4000-8000-000000009002`,type:`income`}})},W={name:`编辑记账：转账类型可切换到支出或收入`,render:()=>(0,j.jsx)(rt,{...P,initialValues:I})},G={name:`编辑已关联支出：可编辑并显示核销结余`,render:()=>(0,j.jsx)(O,{...P,initialValues:{payments:[{accountId:`00000000-0000-4000-8000-000000000045`,amount:null}],items:[{amount:`1200`,businessNetAmount:`-300`,businessStatus:{incomeLinkRole:null,offsetComposition:{refundAmount:`0`,reimbursementAmount:`1500`},settlementStatus:`reimbursementSurplus`},categoryId:`00000000-0000-4000-8000-000000005072`,expectedUpdatedAt:`2026-08-21T01:00:00.000Z`,id:`00000000-0000-4000-8000-000000008001`,specialStatus:`reimbursementSurplus`}],merchantId:`00000000-0000-4000-8000-000000001001`,note:`已有关联但仍可修正`,transactionAt:`2026-08-20T03:20:10.000Z`,transactionRecordId:`00000000-0000-4000-8000-000000009004`,type:`expense`}})},K={name:`删除仍被子项关联的母项被拒绝`,render:()=>(0,j.jsx)(O,{...P,deleteAction:async()=>({error:`该交易包含已关联的退款 / 报销明细，请先解除关联后再删除。`,errorCode:w.linkedDeleteForbidden,errorKey:`storybook-linked-delete-forbidden`}),initialValues:{payments:[{accountId:`00000000-0000-4000-8000-000000000045`,amount:null}],items:[{amount:`1200`,businessStatus:{incomeLinkRole:null,offsetComposition:{refundAmount:`0`,reimbursementAmount:`1200`},settlementStatus:`reimbursed`},categoryId:`00000000-0000-4000-8000-000000005072`,expectedUpdatedAt:`2026-08-21T01:00:00.000Z`,id:`00000000-0000-4000-8000-000000008001`,specialStatus:`reimbursed`}],merchantId:`00000000-0000-4000-8000-000000001001`,note:`删除前需要解除关联`,transactionAt:`2026-08-20T03:20:10.000Z`,transactionRecordId:`00000000-0000-4000-8000-000000009005`,type:`expense`}}),play:async({canvasElement:e})=>{let t=N(e);await M.click(await t.findByRole(`button`,{name:`删除`})),await M.click(await N(document.body).findByRole(`button`,{name:`删除`})),await N(document.body).findByText(`无法删除已关联明细`)}},q={name:`删除关联收入时提示自动解除关联`,render:()=>(0,j.jsx)(O,{...P,initialValues:{payments:[{accountId:`00000000-0000-4000-8000-000000000045`,amount:null}],items:[{amount:`1200`,businessStatus:{incomeLinkRole:`reimbursement`,offsetComposition:{refundAmount:`0`,reimbursementAmount:`0`},settlementStatus:null},categoryId:`00000000-0000-4000-8000-000000005073`,expectedUpdatedAt:`2026-08-21T01:00:00.000Z`,id:`00000000-0000-4000-8000-000000008002`,specialStatus:null}],merchantId:`00000000-0000-4000-8000-000000001001`,note:`删除时自动解除关联`,transactionAt:`2026-08-20T03:20:10.000Z`,transactionRecordId:`00000000-0000-4000-8000-000000009006`,type:`income`}}),play:async({canvasElement:e})=>{let t=N(e);await M.click(await t.findByRole(`button`,{name:`删除`})),await N(document.body).findByText(`删除后这笔记账会从明细页移除，并解除退款 / 报销关联，目标支出的核销净额会相应变化。是否继续？`)}},J={name:`只读详情：他人创建的普通记录`,render:()=>(0,j.jsx)(O,{...P,canDelete:!1,editRestriction:`permission`,initialValues:F})},Y={name:`只读详情：他人创建的多账户记录`,render:()=>(0,j.jsx)(O,{...P,canDelete:!1,editRestriction:`permission`,initialValues:kt})},X={name:`只读详情：账户已归档（可删除）`,render:()=>(0,j.jsx)(O,{...P,editRestriction:`archivedAccount`,initialValues:F})},Z={name:`只读详情：已关联报销或退款`,render:()=>(0,j.jsx)(O,{...P,editRestriction:`linked`,initialValues:F})},Q={name:`只读详情：他人创建的转账`,render:()=>(0,j.jsx)(rt,{...P,canDelete:!1,editRestriction:`permission`,initialValues:I})},$={name:`只读详情：转账账户已归档（可删除）`,render:()=>(0,j.jsx)(rt,{...P,editRestriction:`archivedAccount`,initialValues:I})},L.parameters={...L.parameters,docs:{...L.parameters?.docs,source:{originalSource:`{
  name: "新增记账页面"
}`,...L.parameters?.docs?.source}}},R.parameters={...R.parameters,docs:{...R.parameters?.docs,source:{originalSource:`{
  name: "含错误提示",
  args: {
    errorMessage: "新增记账失败。请稍后重试。"
  }
}`,...R.parameters?.docs?.source}}},z.parameters={...z.parameters,docs:{...z.parameters?.docs,source:{originalSource:`{
  name: "无新增权限",
  render: () => <TransactionPermissionDenied />
}`,...z.parameters?.docs?.source}}},B.parameters={...B.parameters,docs:{...B.parameters?.docs,source:{originalSource:`{
  name: "无账户和分类选项",
  args: {
    accountOptions: [],
    categoryOptions: [],
    merchantOptions: []
  }
}`,...B.parameters?.docs?.source}}},V.parameters={...V.parameters,docs:{...V.parameters?.docs,source:{originalSource:`{
  name: "编辑支出：可切换到转账",
  render: () => <EditTransactionTemplate {...editArgs} initialValues={expenseEditInitialValues} />
}`,...V.parameters?.docs?.source}}},H.parameters={...H.parameters,docs:{...H.parameters?.docs,source:{originalSource:`{
  name: "编辑多账户支出（卡 1 + 卡 2）",
  render: () => <EditTransactionTemplate {...editArgs} initialValues={multiAccountEditInitialValues} />
}`,...H.parameters?.docs?.source}}},U.parameters={...U.parameters,docs:{...U.parameters?.docs,source:{originalSource:`{
  name: "编辑收入：可切换到转账",
  render: () => <EditTransactionTemplate {...editArgs} initialValues={{
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
}`,...U.parameters?.docs?.source}}},W.parameters={...W.parameters,docs:{...W.parameters?.docs,source:{originalSource:`{
  name: "编辑记账：转账类型可切换到支出或收入",
  render: () => <EditTransferTransactionTemplate {...editArgs} initialValues={transferEditInitialValues} />
}`,...W.parameters?.docs?.source}}},G.parameters={...G.parameters,docs:{...G.parameters?.docs,source:{originalSource:`{
  name: "编辑已关联支出：可编辑并显示核销结余",
  render: () => <EditTransactionTemplate {...editArgs} initialValues={{
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
}`,...G.parameters?.docs?.source}}},K.parameters={...K.parameters,docs:{...K.parameters?.docs,source:{originalSource:`{
  name: "删除仍被子项关联的母项被拒绝",
  render: () => <EditTransactionTemplate {...editArgs} deleteAction={async () => ({
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
}`,...K.parameters?.docs?.source}}},q.parameters={...q.parameters,docs:{...q.parameters?.docs,source:{originalSource:`{
  name: "删除关联收入时提示自动解除关联",
  render: () => <EditTransactionTemplate {...editArgs} initialValues={{
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
}`,...q.parameters?.docs?.source}}},J.parameters={...J.parameters,docs:{...J.parameters?.docs,source:{originalSource:`{
  name: "只读详情：他人创建的普通记录",
  render: () => <EditTransactionTemplate {...editArgs} canDelete={false} editRestriction="permission" initialValues={expenseEditInitialValues} />
}`,...J.parameters?.docs?.source}}},Y.parameters={...Y.parameters,docs:{...Y.parameters?.docs,source:{originalSource:`{
  name: "只读详情：他人创建的多账户记录",
  render: () => <EditTransactionTemplate {...editArgs} canDelete={false} editRestriction="permission" initialValues={multiAccountEditInitialValues} />
}`,...Y.parameters?.docs?.source}}},X.parameters={...X.parameters,docs:{...X.parameters?.docs,source:{originalSource:`{
  name: "只读详情：账户已归档（可删除）",
  render: () => <EditTransactionTemplate {...editArgs} editRestriction="archivedAccount" initialValues={expenseEditInitialValues} />
}`,...X.parameters?.docs?.source}}},Z.parameters={...Z.parameters,docs:{...Z.parameters?.docs,source:{originalSource:`{
  name: "只读详情：已关联报销或退款",
  render: () => <EditTransactionTemplate {...editArgs} editRestriction="linked" initialValues={expenseEditInitialValues} />
}`,...Z.parameters?.docs?.source}}},Q.parameters={...Q.parameters,docs:{...Q.parameters?.docs,source:{originalSource:`{
  name: "只读详情：他人创建的转账",
  render: () => <EditTransferTransactionTemplate {...editArgs} canDelete={false} editRestriction="permission" initialValues={transferEditInitialValues} />
}`,...Q.parameters?.docs?.source}}},$.parameters={...$.parameters,docs:{...$.parameters?.docs,source:{originalSource:`{
  name: "只读详情：转账账户已归档（可删除）",
  render: () => <EditTransferTransactionTemplate {...editArgs} editRestriction="archivedAccount" initialValues={transferEditInitialValues} />
}`,...$.parameters?.docs?.source}}},jt=[`Default`,`WithError`,`PermissionDenied`,`EmptyOptions`,`EditExpenseConvert`,`EditMultiAccountExpense`,`EditIncomeConvert`,`EditTransferConvert`,`EditLinkedExpense`,`LinkedDeleteForbidden`,`LinkedIncomeDeleteConfirmation`,`ReadOnlyPermission`,`ReadOnlyMultiAccountPermission`,`ReadOnlyArchivedAccount`,`ReadOnlyLinked`,`ReadOnlyTransferPermission`,`ReadOnlyTransferArchivedAccount`]}))();export{L as Default,V as EditExpenseConvert,U as EditIncomeConvert,G as EditLinkedExpense,H as EditMultiAccountExpense,W as EditTransferConvert,B as EmptyOptions,K as LinkedDeleteForbidden,q as LinkedIncomeDeleteConfirmation,z as PermissionDenied,X as ReadOnlyArchivedAccount,Z as ReadOnlyLinked,Y as ReadOnlyMultiAccountPermission,J as ReadOnlyPermission,$ as ReadOnlyTransferArchivedAccount,Q as ReadOnlyTransferPermission,R as WithError,jt as __namedExportsOrder,At as default};