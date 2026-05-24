/**
 * AI Voice Action Engine for macosplay (Next.js Web Version)
 * 
 * Server-side version for API routes.
 * Same logic as mobile version but uses Node.js runtime.
 */

const LLM_API_KEY = process.env.WAFER_API_KEY || '';
const LLM_URL = 'https://pass.wafer.ai/v1/chat/completions';

// ─── Types ────────────────────────────────────────────────────────────────────

export type VoiceIntent = 
  | 'create_listing'
  | 'search_items'
  | 'book_service'
  | 'join_project'
  | 'create_project'
  | 'ask_question'
  | 'unknown';

export interface VoiceAction {
  intent: VoiceIntent;
  confidence: number;
  extractedData: any;
  requiresConfirmation: boolean;
  suggestedResponse: string;
}

export interface CreateListingData {
  title: string;
  description?: string;
  series?: string;
  character?: string;
  size?: 'S' | 'M' | 'L' | 'XL' | 'XXL' | 'Free Size';
  rentalPricePerDay?: number;
  salePrice?: number;
  depositAmount?: number;
  condition?: 'new' | 'like_new' | 'good' | 'fair' | 'poor';
  province?: string;
  tags?: string[];
  listingType?: 'rental' | 'used_sale' | 'preorder';
}

export interface SearchItemsData {
  series?: string;
  character?: string;
  size?: string;
  minPrice?: number;
  maxPrice?: number;
  province?: string;
  listingType?: 'rental' | 'used_sale';
}

export interface BookServiceData {
  serviceType: 'makeup' | 'photo' | 'prop';
  artistName?: string;
  preferredDate?: string;
  preferredTime?: string;
  location?: string;
  notes?: string;
}

export interface CreateProjectData {
  title: string;
  description: string;
  projectType: 'group_cosplay' | 'photoshoot' | 'contest_team' | 'cg_cosplay' | 'other';
  series?: string;
  province?: string;
  eventDate?: string;
  maxMembers?: number;
  contactFacebook?: string;
  contactLine?: string;
}

// ─── System Prompt ────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `คุณคือ AI ที่ช่วยแยกความตั้งใจ (intent) จากคำพูดของผู้ใช้แอป macosplay
วิเคราะห์คำพูดและตอบกลับเป็น JSON เท่านั้น (ไม่มีข้อความอื่น):

{
  "intent": "create_listing|search_items|book_service|join_project|create_project|ask_question|unknown",
  "confidence": 0.0-1.0,
  "extractedData": { ... },
  "requiresConfirmation": true/false,
  "suggestedResponse": "ข้อความตอบกลับสั้นๆ เป็นภาษาไทย"
}

กฎการแยก intent:
- create_listing: ผู้ใช้ต้องการขาย/เช่าชุด (มีคำว่า "ขาย", "เช่า", "มีชุด", "รับเช่า")
- search_items: ผู้ใช้ต้องการหาชุด (มีคำว่า "หา", "มอง", "ต้องการ", "มี...ไหม")
- book_service: ผู้ใช้ต้องการจองบริการ (มีคำว่า "จอง", "นัด", "makeup", "ถ่ายภาพ", "พร็อพ")
- join_project: ผู้ใช้ต้องการเข้าร่วมโปรเจกต์ (มีคำว่า "ร่วม", "สมัคร", "เข้าทีม")
- create_project: ผู้ใช้ต้องการสร้างโปรเจกต์ใหม่ (มีคำว่า "สร้างทีม", "หาทีม", "เปิดรับ")
- ask_question: คำถามทั่วไปเกี่ยวกับคอสเพลย์

ตอบเป็น JSON เท่านั้น!`;

// ─── Main Action Engine ───────────────────────────────────────────────────────

export async function processVoiceAction(transcript: string): Promise<VoiceAction> {
  if (!LLM_API_KEY) {
    return fallbackExtraction(transcript);
  }

  try {
    const response = await fetch(LLM_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${LLM_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'qwen/qwen3.6-max-preview',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: transcript },
        ],
        temperature: 0.1,
        max_tokens: 800,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      console.error('[VoiceAction] LLM error:', response.status);
      return fallbackExtraction(transcript);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      return fallbackExtraction(transcript);
    }

    const action: VoiceAction = JSON.parse(content);
    console.log('[VoiceAction] Extracted:', JSON.stringify(action, null, 2));
    
    return action;
  } catch (error) {
    console.error('[VoiceAction] Processing failed:', error);
    return fallbackExtraction(transcript);
  }
}

// ─── Fallback: Basic Keyword Extraction ───────────────────────────────────────

function fallbackExtraction(transcript: string): VoiceAction {
  const lower = transcript.toLowerCase();
  
  let intent: VoiceIntent = 'unknown';
  if (lower.includes('เช่า') || lower.includes('ขาย') || lower.includes('รับเช่า')) {
    intent = 'create_listing';
  } else if (lower.includes('หา') || lower.includes('มอง') || lower.includes('ต้องการ')) {
    intent = 'search_items';
  } else if (lower.includes('จอง') || lower.includes('นัด')) {
    intent = 'book_service';
  } else if (lower.includes('ร่วม') || lower.includes('สมัคร')) {
    intent = 'join_project';
  } else if (lower.includes('สร้าง') || lower.includes('เปิดรับ')) {
    intent = 'create_project';
  } else {
    intent = 'ask_question';
  }

  const extractedData: any = {};
  
  const priceMatch = transcript.match(/(\d+)\s*(฿|บาท)/);
  if (priceMatch) {
    const price = parseInt(priceMatch[1]);
    if (lower.includes('เช่า')) {
      extractedData.rentalPricePerDay = price;
    } else {
      extractedData.salePrice = price;
    }
  }

  const sizeMatch = transcript.match(/\b(S|M|L|XL|XXL|Free\s*Size)\b/i);
  if (sizeMatch) {
    extractedData.size = sizeMatch[1].replace(/\s/g, '');
  }

  return {
    intent,
    confidence: 0.5,
    extractedData,
    requiresConfirmation: true,
    suggestedResponse: 'กรุณาตรวจสอบข้อมูลก่อนดำเนินการ',
  };
}

// ─── Action Executors ─────────────────────────────────────────────────────────

/**
 * Execute the extracted action.
 * Returns success/failure and any created/updated record IDs.
 */
export async function executeVoiceAction(
  action: VoiceAction,
  context: {
    userId?: string;
    userStoreId?: string;
    pb: any; // PocketBase client
  }
): Promise<{ success: boolean; recordId?: string; message: string }> {
  const { pb, userId, userStoreId } = context;

  if (!pb) {
    return { success: false, message: 'PocketBase client not available' };
  }

  try {
    switch (action.intent) {
      case 'create_listing':
        return executeCreateListing(action.extractedData as CreateListingData, { userId, userStoreId, pb });
      
      case 'search_items':
        return executeSearchItems(action.extractedData as SearchItemsData, { pb });
      
      case 'book_service':
        return executeBookService(action.extractedData as BookServiceData, { userId, pb });
      
      case 'create_project':
        return executeCreateProject(action.extractedData as CreateProjectData, { userId, pb });
      
      case 'join_project':
        return executeJoinProject(action.extractedData as any, { userId, pb });
      
      default:
        return { 
          success: false, 
          message: 'ไม่ทราบคำสั่งที่ต้องการ กรุณาลองใหม่อีกครั้ง' 
        };
    }
  } catch (error: any) {
    console.error('[VoiceAction] Execute failed:', error);
    return { 
      success: false, 
      message: error.message ?? 'เกิดข้อผิดพลาดในการดำเนินการ' 
    };
  }
}

// ─── Individual Action Executors ──────────────────────────────────────────────

async function executeCreateListing(
  data: CreateListingData,
  { userId, userStoreId, pb }: { userId?: string; userStoreId?: string; pb: any }
): Promise<{ success: boolean; recordId?: string; message: string }> {
  if (!userStoreId) {
    return { success: false, message: 'ไม่พบร้านของคุณ กรุณาสร้า้งร้านก่อน' };
  }

  const tagsArray = data.tags || [];
  if (data.series) tagsArray.push(data.series);
  if (data.character) tagsArray.push(data.character);
  if (data.size) tagsArray.push(data.size);

  const record = await pb.collection('itemList').create({
    Name: data.title,
    Desc: data.description || '',
    Province: data.province || '',
    Size: data.size || 'Free Size',
    Status: 'พร้อมให้เช่า',
    tags: tagsArray,
    public: true,
    user: userId,
    userStore: userStoreId,
    price: data.salePrice,
    price_test: data.rentalPricePerDay,
    isPriTest: !!data.rentalPricePerDay,
    deposit: data.depositAmount,
    Condition: data.condition || 'good',
  });

  return { 
    success: true, 
    recordId: record.id, 
    message: 'เพิ่มสินค้าเรียบร้อยแล้ว ✨' 
  };
}

async function executeSearchItems(
  data: SearchItemsData,
  { pb }: { pb: any }
): Promise<{ success: boolean; results?: any[]; message: string }> {
  let filter = 'public = true';
  
  if (data.series) {
    filter += ` && tags ~ "${data.series}"`;
  }
  if (data.character) {
    filter += ` && tags ~ "${data.character}"`;
  }
  if (data.size) {
    filter += ` && Size = "${data.size}"`;
  }
  if (data.province) {
    filter += ` && Province = "${data.province}"`;
  }
  if (data.maxPrice) {
    filter += ` && price <= ${data.maxPrice}`;
  }

  const results = await pb.collection('itemList').getList(1, 50, { filter });
  
  return { 
    success: true, 
    results: results.items, 
    message: `พบ ${results.items.length} รายการ 🎭` 
  };
}

async function executeBookService(
  data: BookServiceData,
  { userId, pb }: { userId?: string; pb: any }
): Promise<{ success: boolean; recordId?: string; message: string }> {
  if (!userId) {
    return { success: false, message: 'กรุณาล็อกอินก่อนจองบริการ' };
  }

  const record = await pb.collection('service_bookings').create({
    user: userId,
    service_type: data.serviceType,
    preferred_date: data.preferredDate,
    preferred_time: data.preferredTime,
    location: data.location,
    notes: data.notes,
    status: 'pending',
  });

  return { 
    success: true, 
    recordId: record.id, 
    message: 'ส่งคำขอจองเรียบร้อยแล้ว รอช่างยืนยัน 📅' 
  };
}

async function executeCreateProject(
  data: CreateProjectData,
  { userId, pb }: { userId?: string; pb: any }
): Promise<{ success: boolean; recordId?: string; message: string }> {
  if (!userId) {
    return { success: false, message: 'กรุณาล็อกอินก่อนสร้างโปรเจกต์' };
  }

  const record = await pb.collection('cosplay_projects').create({
    owner: userId,
    title: data.title,
    description: data.description,
    project_type: data.projectType,
    series_text: data.series || '',
    province: data.province || '',
    event_date: data.eventDate,
    max_members: data.maxMembers || 10,
    status: 'open',
    visibility: 'public',
    contact_facebook: data.contactFacebook || '',
    contact_line: data.contactLine || '',
  });

  return { 
    success: true, 
    recordId: record.id, 
    message: 'สร้างโปรเจกต์เรียบร้อยแล้ว 🎬' 
  };
}

async function executeJoinProject(
  data: any,
  { userId, pb }: { userId?: string; pb: any }
): Promise<{ success: boolean; recordId?: string; message: string }> {
  if (!userId || !data.projectId) {
    return { success: false, message: 'ข้อมูลไม่ครบถ้วน' };
  }

  const record = await pb.collection('project_members').create({
    project: data.projectId,
    user: userId,
    character_interest: data.characterInterest || '',
    has_costume: data.hasCostume ?? false,
    experience: data.experience || 'beginner',
    status: 'pending',
    notes: data.notes || '',
  });

  return { 
    success: true, 
    recordId: record.id, 
    message: 'ส่งคำขอเข้าร่วมโปรเจกต์แล้ว 🎭' 
  };
}
