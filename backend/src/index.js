// Enhanced Cloudflare Worker with all new features
export default {
  async fetch(request, env, ctx) {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    try {
      // Form submission with file upload support
      if (path === '/api/submit-form' && request.method === 'POST') {
        return await handleFormSubmit(request, env, corsHeaders);
      }

      // Get form configuration
      if (path === '/api/form-config' && request.method === 'GET') {
        return await handleGetFormConfig(request, env, corsHeaders);
      }

      // Verify payment
      if (path === '/api/verify-payment' && request.method === 'POST') {
        return await handleVerifyPayment(request, env, corsHeaders);
      }

      // Get all forms (with auth)
      if (path === '/api/forms' && request.method === 'GET') {
        return await handleGetForms(request, env, corsHeaders);
      }

      // Save form configuration (with auth)
      if (path === '/api/forms' && request.method === 'POST') {
        return await handleSaveForm(request, env, corsHeaders);
      }

      // Update form (with auth)
      if (path === '/api/forms' && request.method === 'PUT') {
        return await handleUpdateForm(request, env, corsHeaders);
      }

      // Get single form
      if (path.startsWith('/api/form/') && request.method === 'GET') {
        const formId = path.split('/').pop();
        return await handleGetSingleForm(formId, env, corsHeaders);
      }

      // Delete form (with auth)
      if (path.startsWith('/api/forms/') && request.method === 'DELETE') {
        const formId = path.split('/').pop();
        return await handleDeleteForm(formId, request, env, corsHeaders);
      }

      // Get submissions (with auth)
      if (path === '/api/submissions' && request.method === 'GET') {
        return await handleGetSubmissions(request, env, corsHeaders);
      }

      // Verify admin
      if (path === '/api/verify-admin' && request.method === 'GET') {
        return await handleVerifyAdmin(request, env, corsHeaders);
      }

      // Upload file endpoint
      if (path === '/api/upload' && request.method === 'POST') {
        return await handleFileUpload(request, env, corsHeaders);
      }

      // Save & Resume - Save draft
      if (path === '/api/save-draft' && request.method === 'POST') {
        return await handleSaveDraft(request, env, corsHeaders);
      }

      // Save & Resume - Get draft
      if (path === '/api/get-draft' && request.method === 'GET') {
        return await handleGetDraft(request, env, corsHeaders);
      }

      // Verify reCAPTCHA
      if (path === '/api/verify-recaptcha' && request.method === 'POST') {
        return await handleVerifyRecaptcha(request, env, corsHeaders);
      }

      // Verify Turnstile
      if (path === '/api/verify-turnstile' && request.method === 'POST') {
        return await handleVerifyTurnstile(request, env, corsHeaders);
      }

      return new Response('Not Found', { status: 404, headers: corsHeaders });
    } catch (error) {
      console.error('Error:', error);
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  }
};

// Handle form submission with file support
async function handleFormSubmit(request, env, corsHeaders) {
  const contentType = request.headers.get('content-type');
  let formData, files = [];

  if (contentType?.includes('multipart/form-data')) {
    const formDataObj = await request.formData();
    formData = {};
    
    for (const [key, value] of formDataObj.entries()) {
      if (value instanceof File) {
        // Handle file upload
        const fileData = await uploadFile(value, env);
        files.push({ field: key, ...fileData });
        formData[key] = fileData.url;
      } else {
        formData[key] = value;
      }
    }
  } else {
    const data = await request.json();
    formData = data.formData;
  }

  const { paymentReference, amount } = await request.json().catch(() => ({}));

  // Validate payment if reference exists
  if (paymentReference) {
    const isValid = await verifyPaystackTransaction(paymentReference, env.PAYSTACK_SECRET_KEY);
    if (!isValid) {
      return new Response(
        JSON.stringify({ error: 'Payment verification failed' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  }

  const submissionId = crypto.randomUUID();
  const timestamp = new Date().toISOString();

  const submission = {
    id: submissionId,
    data: formData,
    files,
    paymentReference,
    amount,
    timestamp,
    status: paymentReference ? 'paid' : 'submitted'
  };

  // Save to D1
  try {
    await env.DB.prepare(
      `INSERT INTO submissions (id, email, data, payment_ref, amount, status, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      submissionId,
      formData.email || '',
      JSON.stringify(formData),
      paymentReference,
      amount,
      submission.status,
      timestamp
    ).run();
  } catch (dbError) {
    console.error('Database error:', dbError);
  }

  // Send confirmation email
  if (env.RESEND_API_KEY && formData.email) {
    await sendConfirmationEmail(formData.email, submission, env.RESEND_API_KEY);
  }

  // Send webhook notification
  if (env.WEBHOOK_URL) {
    await fetch(env.WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(submission)
    });
  }

  return new Response(
    JSON.stringify({ 
      success: true, 
      submissionId,
      message: 'Form submitted successfully' 
    }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// File upload handler
async function uploadFile(file, env) {
  const fileName = `${Date.now()}-${file.name}`;
  const arrayBuffer = await file.arrayBuffer();
  
  // If R2 is configured, upload there
  if (env.R2_BUCKET) {
    await env.R2_BUCKET.put(fileName, arrayBuffer, {
      httpMetadata: {
        contentType: file.type,
      },
    });
    return {
      filename: file.name,
      url: `/uploads/${fileName}`,
      size: file.size,
      type: file.type
    };
  }
  
  // Otherwise store metadata only
  return {
    filename: file.name,
    url: '#',
    size: file.size,
    type: file.type
  };
}

// Save draft for Save & Resume feature
async function handleSaveDraft(request, env, corsHeaders) {
  const { draftId, formId, data } = await request.json();
  const id = draftId || crypto.randomUUID();
  
  try {
    if (env.FORMS_KV) {
      await env.FORMS_KV.put(`draft:${id}`, JSON.stringify({
        formId,
        data,
        savedAt: new Date().toISOString()
      }), { expirationTtl: 7 * 24 * 60 * 60 }); // 7 days expiration
    }
    
    return new Response(
      JSON.stringify({ success: true, draftId: id }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Failed to save draft' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

// Get draft
async function handleGetDraft(request, env, corsHeaders) {
  const url = new URL(request.url);
  const draftId = url.searchParams.get('id');
  
  try {
    if (env.FORMS_KV) {
      const draft = await env.FORMS_KV.get(`draft:${draftId}`, { type: 'json' });
      if (draft) {
        return new Response(
          JSON.stringify(draft),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }
    
    return new Response(
      JSON.stringify({ error: 'Draft not found' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Failed to retrieve draft' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

// Verify reCAPTCHA
async function handleVerifyRecaptcha(request, env, corsHeaders) {
  const { token } = await request.json();
  
  try {
    const response = await fetch(
      'https://www.google.com/recaptcha/api/siteverify',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `secret=${env.RECAPTCHA_SECRET_KEY}&response=${token}`
      }
    );
    
    const result = await response.json();
    return new Response(
      JSON.stringify({ valid: result.success }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ valid: false }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

// Verify Cloudflare Turnstile
async function handleVerifyTurnstile(request, env, corsHeaders) {
  const { token } = await request.json();
  
  try {
    const response = await fetch(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          secret: env.TURNSTILE_SECRET_KEY,
          response: token
        })
      }
    );
    
    const result = await response.json();
    return new Response(
      JSON.stringify({ valid: result.success }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ valid: false }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

// Verify Paystack transaction
async function verifyPaystackTransaction(reference, secretKey) {
  try {
    const response = await fetch(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          'Authorization': `Bearer ${secretKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const result = await response.json();
    return result.status && result.data.status === 'success';
  } catch (error) {
    console.error('Paystack verification error:', error);
    return false;
  }
}

// Send confirmation email
async function sendConfirmationEmail(email, submission, apiKey) {
  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'noreply@yourdomain.com',
        to: email,
        subject: 'Form Submission Confirmation',
        html: `
          <h2>Thank you for your submission!</h2>
          <p>Submission ID: ${submission.id}</p>
          <p>Status: ${submission.status}</p>
        `
      })
    });
  } catch (error) {
    console.error('Email sending error:', error);
  }
}

// Get form configuration
async function handleGetFormConfig(request, env, corsHeaders) {
  const url = new URL(request.url);
  const formId = url.searchParams.get('id') || 'default';
  return await handleGetSingleForm(formId, env, corsHeaders);
}

// Get single form
async function handleGetSingleForm(formId, env, corsHeaders) {
  try {
    let config;

    if (env.FORMS_KV) {
      config = await env.FORMS_KV.get(`form:${formId}`, { type: 'json' });
    }

    if (!config && env.DB) {
      const result = await env.DB.prepare(
        'SELECT config FROM form_configs WHERE id = ? AND active = 1'
      ).bind(formId).first();
      
      if (result) {
        config = JSON.parse(result.config);
      }
    }

    if (!config) {
      config = getDefaultFormConfig();
    }

    return new Response(
      JSON.stringify(config),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Form not found' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

// Save form configuration
async function handleSaveForm(request, env, corsHeaders) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || authHeader !== `Bearer ${env.API_SECRET}`) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const formConfig = await request.json();
    const formId = formConfig.id || `form_${Date.now()}`;
    formConfig.id = formId;
    formConfig.createdAt = new Date().toISOString();
    formConfig.updatedAt = new Date().toISOString();
    
    // Save to KV
    if (env.FORMS_KV) {
      await env.FORMS_KV.put(`form:${formId}`, JSON.stringify(formConfig));
    }
    
    // Save to D1
    if (env.DB) {
      await env.DB.prepare(
        `INSERT OR REPLACE INTO form_configs (id, name, config, active, created_at, updated_at) 
         VALUES (?, ?, ?, ?, ?, ?)`
      ).bind(
        formId,
        formConfig.title,
        JSON.stringify(formConfig),
        1,
        formConfig.createdAt,
        formConfig.updatedAt
      ).run();
    }

    return new Response(
      JSON.stringify({ success: true, formId }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Save form error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to save form' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

// Update form configuration
async function handleUpdateForm(request, env, corsHeaders) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || authHeader !== `Bearer ${env.API_SECRET}`) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const formConfig = await request.json();
    formConfig.updatedAt = new Date().toISOString();
    
    if (env.FORMS_KV) {
      await env.FORMS_KV.put(`form:${formConfig.id}`, JSON.stringify(formConfig));
    }
    
    if (env.DB) {
      await env.DB.prepare(
        `UPDATE form_configs SET name = ?, config = ?, updated_at = ? WHERE id = ?`
      ).bind(
        formConfig.title,
        JSON.stringify(formConfig),
        formConfig.updatedAt,
        formConfig.id
      ).run();
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Failed to update form' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

// Get all forms
async function handleGetForms(request, env, corsHeaders) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || authHeader !== `Bearer ${env.API_SECRET}`) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    let forms = [];

if (env.DB) {
  const results = await env.DB.prepare(
    'SELECT id, name, config, active FROM form_configs ORDER BY active DESC, created_at DESC'
  ).all();
  
  forms = results.results.map(row => ({
    ...JSON.parse(row.config),
    active: row.active === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }));
    } else if (env.FORMS_KV) {
      const list = await env.FORMS_KV.list({ prefix: 'form:' });
      for (const key of list.keys) {
        const config = await env.FORMS_KV.get(key.name, { type: 'json' });
        if (config) forms.push(config);
      }
    }

    return new Response(
      JSON.stringify({ forms }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Get forms error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to retrieve forms' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

// Delete form
async function handleDeleteForm(formId, request, env, corsHeaders) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || authHeader !== `Bearer ${env.API_SECRET}`) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    if (env.FORMS_KV) {
      await env.FORMS_KV.delete(`form:${formId}`);
    }
    
    if (env.DB) {
      await env.DB.prepare(
        'UPDATE form_configs SET active = 0 WHERE id = ?'
      ).bind(formId).run();
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Failed to delete form' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

// Get submissions
async function handleGetSubmissions(request, env, corsHeaders) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || authHeader !== `Bearer ${env.API_SECRET}`) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const results = await env.DB.prepare(
      'SELECT * FROM submissions ORDER BY created_at DESC LIMIT 100'
    ).all();

    return new Response(
      JSON.stringify({ submissions: results.results }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Database error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

// Verify payment
async function handleVerifyPayment(request, env, corsHeaders) {
  const { reference } = await request.json();
  const isValid = await verifyPaystackTransaction(reference, env.PAYSTACK_SECRET_KEY);
  
  return new Response(
    JSON.stringify({ valid: isValid }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// Verify admin
async function handleVerifyAdmin(request, env, corsHeaders) {
  const authHeader = request.headers.get('Authorization');
  
  if (authHeader === `Bearer ${env.API_SECRET}`) {
    return new Response(
      JSON.stringify({ valid: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
  
  return new Response(
    JSON.stringify({ valid: false }),
    { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// Default form configuration
function getDefaultFormConfig() {
  return {
    id: 'default',
    title: "Sample Form",
    description: "This is a sample form",
    theme: {
      primaryColor: "#6366f1",
      accentColor: "#8b5cf6",
      backgroundColor: "#0f172a"
    },
    fields: [
      {
        id: "name",
        type: "text",
        label: "Full Name",
        required: true
      },
      {
        id: "email",
        type: "email",
        label: "Email Address",
        required: true
      }
    ],
    calculation: {
      enabled: false
    },
    payment: {
      enabled: false
    },
    conditionalLogic: []
  };
}