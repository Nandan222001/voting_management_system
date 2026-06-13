import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { FaCheckCircle, FaShieldAlt, FaRocket, FaGem, FaUser } from 'react-icons/fa';
import AppLogo from '../components/common/AppLogo';
import toast from 'react-hot-toast';
import MainLayout from '../components/layout/MainLayout';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { fetchPlans } from '../store/slices/planSlice';
import paymentService from '../services/paymentService';

const getPlanIcon = (name = '') => {
  const n = name.toLowerCase();
  if (n.includes('elite') || n.includes('gold') || n.includes('premium')) return FaGem;
  if (n.includes('active') || n.includes('pro') || n.includes('silver')) return FaRocket;
  if (n.includes('basic') || n.includes('standard')) return AppLogo;
  return FaUser;
};

/**
 * Dynamically load the Razorpay checkout script if not already present.
 * Returns a promise that resolves when the script is ready.
 */
function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function PlansPage() {
  const dispatch = useDispatch();
  const { items: plans, loading } = useSelector((state) => state.plans);
  const currentUser = useSelector((state) => state.auth?.user || null);

  const [processingPlanId, setProcessingPlanId] = useState(null);

  useEffect(() => {
    dispatch(fetchPlans({ active_only: true }));
  }, [dispatch]);

  const handleSelectPlan = async (plan) => {
    // Free plan — just show a success toast
    if (plan.price === 0) {
      toast.success(`${plan.name} activated! No payment required.`);
      return;
    }

    setProcessingPlanId(plan.id);
    try {
      // 1. Create order on backend
      const orderRes = await paymentService.createMembershipOrder({ membership_plan_id: plan.id });
      const orderData = orderRes.data?.data || orderRes.data;

      // 2. Load Razorpay SDK
      const sdkLoaded = await loadRazorpayScript();
      if (!sdkLoaded) {
        toast.error('Failed to load Razorpay. Please try again.');
        setProcessingPlanId(null);
        return;
      }

      // 3. Open Razorpay checkout
      const options = {
        key: orderData.key_id,
        amount: orderData.amount,
        currency: orderData.currency || 'INR',
        name: 'Digital Voting System',
        description: `${plan.name} Membership`,
        order_id: orderData.order_id || orderData.razorpay_order_id,
        prefill: {
          name: currentUser?.full_name || currentUser?.name || '',
          email: currentUser?.email || '',
          contact: currentUser?.phone || '',
        },
        theme: { color: '#1a337e' },
        handler: async (response) => {
          try {
            await paymentService.verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            toast.success(`Payment successful! ${plan.name} activated.`);
          } catch (err) {
            toast.error(err?.response?.data?.message || 'Payment verification failed.');
          } finally {
            setProcessingPlanId(null);
          }
        },
        modal: {
          ondismiss: () => {
            setProcessingPlanId(null);
          },
        },
      };

      const rzp = new window.Razorpay(options);

      rzp.on('payment.failed', async (response) => {
        try {
          await paymentService.recordFailure({
            membership_plan_id: plan.id,
            error_message: response.error?.description || 'Payment failed',
            razorpay_order_id: orderData.order_id || orderData.razorpay_order_id,
          });
        } catch (_) {
          // best effort
        }
        toast.error(response.error?.description || 'Payment failed. Please try again.');
        setProcessingPlanId(null);
      });

      rzp.open();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to initiate payment. Please try again.');
      setProcessingPlanId(null);
    }
  };

  return (
    <MainLayout title="Voter Membership Plans">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-black tracking-tight text-[#1a337e] sm:text-4xl">
            Choose Your Voting Power
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">
            Select a plan that fits your level of civic engagement. Every plan includes our core security and integrity guarantees.
          </p>
        </div>

        {loading ? (
          <div className="mt-16 flex justify-center">
            <LoadingSpinner />
          </div>
        ) : plans.length === 0 ? (
          <div className="mt-16 rounded-2xl border-2 border-dashed border-slate-200 p-12 text-center">
             <AppLogo size={48} className="mx-auto mb-4" />
             <p className="text-lg font-medium text-slate-500">No membership plans are currently active in your jurisdiction.</p>
          </div>
        ) : (
          <div className="mt-16 grid grid-cols-1 gap-8 lg:grid-cols-3">
            {plans.map((plan) => {
              const Icon = getPlanIcon(plan.name);
              const isProcessing = processingPlanId === plan.id;
              const isFree = plan.price === 0;
              return (
                <div
                  key={plan.id}
                  className={`relative flex flex-col rounded-3xl border p-8 shadow-sm transition-all duration-200 hover:shadow-xl ${
                    plan.is_highlighted
                      ? 'border-[#1a337e] bg-white ring-2 ring-[#1a337e]/10'
                      : 'border-slate-200 bg-white'
                  }`}
                >
                  {plan.is_highlighted && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-[#1a337e] px-4 py-1 text-xs font-bold text-white uppercase tracking-widest">
                      Most Popular
                    </div>
                  )}

                  <div className="mb-8 flex items-center gap-4">
                    <div className={`rounded-2xl p-3 ${plan.is_highlighted ? 'bg-[#1a337e] text-white' : 'bg-slate-100 text-slate-600'}`}>
                      <Icon size={24} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">{plan.name}</h3>
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-black text-slate-900">
                          {isFree ? 'Free' : `₹${plan.price}`}
                        </span>
                        {plan.period && !isFree && (
                          <span className="text-sm font-medium text-slate-500 capitalize">/{plan.period}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <p className="mb-8 text-sm text-slate-600 leading-relaxed min-h-[40px]">
                    {plan.description}
                  </p>

                  <ul className="mb-10 flex-1 space-y-4">
                    {(plan.features || '').split(',').map((feature) => (
                      <li key={feature} className="flex items-start gap-3 text-sm text-slate-700">
                        <FaCheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-500" />
                        <span>{feature.trim()}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    type="button"
                    onClick={() => handleSelectPlan(plan)}
                    disabled={isProcessing || (processingPlanId !== null && processingPlanId !== plan.id)}
                    className={`w-full rounded-2xl py-4 text-sm font-bold transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed ${
                      plan.is_highlighted
                        ? 'bg-[#1a337e] text-white shadow-lg shadow-[#1a337e]/20 hover:brightness-110'
                        : 'bg-slate-100 text-slate-900 hover:bg-slate-200'
                    }`}
                  >
                    {isProcessing ? (
                      <>
                        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        Processing...
                      </>
                    ) : isFree ? (
                      'Activate Free Plan'
                    ) : (
                      'Select Plan'
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-16 rounded-3xl bg-slate-900 p-8 text-white sm:p-12 lg:flex lg:items-center lg:justify-between">
          <div>
            <h3 className="text-2xl font-bold tracking-tight">Need a custom plan for your organization?</h3>
            <p className="mt-2 text-lg text-slate-400">
              We offer tailored solutions for large-scale jurisdictional voting.
            </p>
          </div>
          <button
            type="button"
            className="mt-8 flex w-full items-center justify-center rounded-2xl bg-white px-8 py-4 text-sm font-bold text-slate-900 transition-all hover:bg-slate-100 sm:w-auto lg:mt-0"
          >
            Contact Sales
          </button>
        </div>
      </div>
    </MainLayout>
  );
}
