from datetime import datetime, timedelta

# Helpers

def parse_ddmmyyyy(s):
    try:
        d, m, y = map(int, s.split('/'))
        return datetime(y, m, d)
    except:
        return None


def fmt(d):
    return d.strftime('%d/%m/%Y')

# Scoring logic (mirrors Backend.gs simplified)

def compute_scores(is_daily, submit_date, assigned_date, video_max_time, duration, reflection, links, support1, support2):
    # Video
    if is_daily:
        video_score = 2
    else:
        video_score = 0
        if duration > 0:
            watched_percent = (video_max_time / duration) * 100
            if watched_percent >= 95 or (duration - video_max_time < 10):
                video_score = 2
            elif watched_percent >= 50:
                video_score = 1

    # Reflection
    ref_len = len((reflection or '').strip())
    if ref_len >= 50:
        ref_score = 2
    elif ref_len > 10:
        ref_score = 1
    else:
        ref_score = 0

    # Links
    link_score = sum(1 for l in (links or []) if l and len(l.strip()) > 5)

    # Support
    support_score = (1 if support1 else 0) + (1 if support2 else 0)

    # On-time: allowed to submit early (no penalty); late if submit_date > assigned_date
    on_time = 1
    if assigned_date is not None:
        sd = datetime(assigned_date.year, assigned_date.month, assigned_date.day)
        subd = datetime(submit_date.year, submit_date.month, submit_date.day)
        if subd > sd:
            on_time = -1
    else:
        # daily challenge: assigned_date None, on-time = 1 always
        on_time = 1

    total = video_score + ref_score + link_score + support_score + on_time
    total = max(0, min(10, total))

    return {
        'video': video_score,
        'reflection': ref_score,
        'links': link_score,
        'support': support_score,
        'on_time': on_time,
        'total': total
    }


# Simulate flows

def simulate():
    email = 'student@example.com'
    courseId = 'COURSE123'
    # Enrollment start: today
    today = datetime.now()
    start = datetime(today.year, today.month, today.day)
    start_str = fmt(start)
    print('Enrollment start:', start_str)

    # Build curriculum of 3 lessons
    lessons = []
    for i in range(3):
        assigned = start + timedelta(days=i)
        lessons.append({'id': f'L{i+1}', 'assigned': assigned})

    # Scenarios
    scenarios = [
        {
            'name': 'Pre-submit (allowed) lesson 2 before its assigned date',
            'lesson_idx': 1,
            'submit_date': start,  # submitting on start (which is assigned for lesson 1), before lesson2 assigned
            'duration': 600,
            'video_max_time': 600,
            'reflection': 'Short reflection pre-submit',
            'links': [],
            'support1': False,
            'support2': False,
            'is_daily': False
        },
        {
            'name': 'On-time submit lesson 2',
            'lesson_idx': 1,
            'submit_date': lessons[1]['assigned'],
            'duration': 600,
            'video_max_time': 400,
            'reflection': 'This is a thoughtful reflection that is more than fifty characters long to get full points.',
            'links': ['https://youtu.be/x1'],
            'support1': True,
            'support2': False,
            'is_daily': False
        },
        {
            'name': 'Late submit lesson 1 (after assigned)',
            'lesson_idx': 0,
            'submit_date': lessons[0]['assigned'] + timedelta(days=2),
            'duration': 600,
            'video_max_time': 100,
            'reflection': 'Too late reflection',
            'links': [],
            'support1': False,
            'support2': False,
            'is_daily': False
        },
        {
            'name': 'Daily challenge submit today',
            'lesson_idx': None,
            'submit_date': today,
            'duration': 0,
            'video_max_time': 0,
            'reflection': 'Ghi nhận mỗi ngày, chuyện nhỏ nhưng kiên trì',
            'links': [],
            'support1': False,
            'support2': False,
            'is_daily': True
        }
    ]

    for sc in scenarios:
        print('\nScenario:', sc['name'])
        if sc['is_daily']:
            assigned_date = None
            lesson_id = 'DAILY_CHALLENGE'
        else:
            lesson = lessons[sc['lesson_idx']]
            assigned_date = lesson['assigned']
            lesson_id = lesson['id']
            print('Lesson assigned date:', fmt(assigned_date))
        print('Submit date:', fmt(sc['submit_date']))

        scores = compute_scores(
            sc['is_daily'], sc['submit_date'], assigned_date,
            sc['video_max_time'], sc['duration'], sc['reflection'], sc['links'], sc['support1'], sc['support2']
        )

        print('Scores:', scores)
        # Simulate writing to KH_TienDo and KH_GhiNhanHangNgay
        kh_tiendo_row = {
            'email': email,
            'course': courseId,
            'lesson': lesson_id,
            'assignedDate': fmt(assigned_date) if assigned_date else None,
            'saved_total': scores['total'],
            'isLate': scores['on_time'] == -1
        }
        print('KH_TienDo row simulated:', kh_tiendo_row)
        if sc['is_daily']:
            kh_daily = {
                'email': email,
                'course': courseId,
                'date': fmt(sc['submit_date']),
                'reflection': sc['reflection']
            }
            print('KH_GhiNhanHangNgay row simulated:', kh_daily)


if __name__ == '__main__':
    simulate()
