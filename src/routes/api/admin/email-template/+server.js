export async function GET({ platform, url }) {
  try {
    const templateType = url.searchParams.get('type') || 'confirmation';
    
    const template = await platform.env.RSVPS.prepare(
      'SELECT * FROM email_templates WHERE template_type = ? ORDER BY created_at DESC LIMIT 1'
    ).bind(templateType).first();

    // Set default subjects if none exist
    let subject = template?.subject;
    if (!subject) {
      if (templateType === 'confirmation') {
        subject = 'RSVP Confirmation';
      } else if (templateType === 'blast') {
        subject = 'Wedding Update';
      }
    }

    return new Response(JSON.stringify({ 
      template: template?.template || '',
      subject: subject,
      templateType: templateType
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error fetching email template:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch email template' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function POST({ request, platform }) {
  try {
    const { template, templateType, subject } = await request.json();

    if (!template) {
      return new Response(JSON.stringify({ error: 'Template is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!templateType || !['confirmation', 'blast'].includes(templateType)) {
      return new Response(JSON.stringify({ error: 'Valid template type is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // First, ensure the template_type column exists and properly migrate existing data
    // Check if migration has already been completed by looking for existing template_type values
    const hasTemplateTypes = await platform.env.RSVPS.prepare(
      'SELECT COUNT(*) as count FROM email_templates WHERE template_type IS NOT NULL'
    ).first();
    
    const needsMigration = !hasTemplateTypes || hasTemplateTypes.count === 0;
    
    // Only run migration if we haven't migrated before
    if (needsMigration) {
      console.log('Running migration logic...');
      
      // Update existing templates to be confirmation type
      await platform.env.RSVPS.prepare(
        'UPDATE email_templates SET template_type = "confirmation" WHERE template_type IS NULL'
      ).run();
      
      // Keep only the most recent template and mark it as confirmation
      // First, get the ID of the most recent template
      const mostRecent = await platform.env.RSVPS.prepare(
        'SELECT id FROM email_templates ORDER BY created_at DESC LIMIT 1'
      ).first();
      
      if (mostRecent) {
        // Delete all templates except the most recent one
        await platform.env.RSVPS.prepare(
          'DELETE FROM email_templates WHERE id != ? AND template_type = "confirmation"'
        ).bind(mostRecent.id).run();
        
        // Ensure the most recent one is marked as confirmation
        await platform.env.RSVPS.prepare(
          'UPDATE email_templates SET template_type = "confirmation" WHERE id = ?'
        ).bind(mostRecent.id).run();
      }
      
      // Insert default blast template (only if it doesn't exist)
      await platform.env.RSVPS.prepare(`
        INSERT OR IGNORE INTO email_templates (template, template_type, subject) VALUES (?, ?, ?)
      `).bind(
        `<h2>Important Wedding Update</h2>
        <p>Dear Wedding Guests,</p>
        
        <p>We wanted to share some important information about our upcoming wedding celebration.</p>
        
        <p>Please feel free to reach out if you have any questions.</p>
        
        <p>Looking forward to celebrating with you!</p>
        <p>Bride & Groom</p>`,
        'blast',
        'Wedding Update'
      ).run();
      
      console.log('Migration completed successfully');
    }

    // Update existing template of this type or insert new one
    const existingTemplate = await platform.env.RSVPS.prepare(
      'SELECT id FROM email_templates WHERE template_type = ?'
    ).bind(templateType).first();

    let result;
    if (existingTemplate) {
      // Update existing template
      result = await platform.env.RSVPS.prepare(
        'UPDATE email_templates SET template = ?, subject = ?, created_at = CURRENT_TIMESTAMP WHERE template_type = ?'
      )
        .bind(template, subject, templateType)
        .run();
    } else {
      // Insert new template
      result = await platform.env.RSVPS.prepare(
        'INSERT INTO email_templates (template, template_type, subject) VALUES (?, ?, ?)'
      )
        .bind(template, templateType, subject)
        .run();
    }

    if (result.success) {
      return new Response(JSON.stringify({ success: true }), {
        headers: { 'Content-Type': 'application/json' }
      });
    } else {
      return new Response(JSON.stringify({ error: 'Failed to save template' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  } catch (error) {
    console.error('Error saving email template:', error);
    return new Response(JSON.stringify({ error: 'Failed to save email template' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
