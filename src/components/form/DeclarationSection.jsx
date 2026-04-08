import React from 'react';
import { useFormData } from '../../context/FormContext';

export default function DeclarationSection() {
  const { formData, updateField } = useFormData();

  return (
    <section className="mt-10 text-[15px] leading-relaxed">
      <div className="text-center mb-5">
        <h2 className="text-[20px] font-extrabold inline-block">إقــــــــرار</h2>
      </div>

      <div className="text-justify font-medium text-gray-900 leading-[2.5] text-[16px]">
        <span className="font-bold ml-2">أقر أنا /</span>
        <input
          type="text"
          value={formData.declarationName}
          onChange={(e) => updateField('declarationName', e.target.value)}
          className="inline-block min-w-[300px] border-b-[2px] border-dashed border-gray-600 outline-none bg-transparent px-2 text-center text-blue-700 font-bold focus:border-blue-500 -translate-y-[2px]"
        />
        <span className="font-bold mr-2">
          أن جميع البيانات بعاليه صحيحة وكذلك صور المستفيدين وأن الأولاد في الدراسة ولم يتخرجوا وأن بناتي المدونة أسماءهم لم يتزوجوا بعد واتعهد باخطار المشروع فور زواجهم{' '}
          <span className="font-bold underline decoration-red-400 underline-offset-4">
            مع العلم انه لا يجوز استفادة الابن بعد التخرج أو الابنة بعد الزواج واذا ثبت عكس ذلك أتحمل المسئولية المالية والقانونية فورا مع عدم رد قيمة الاشتراك وتحمل كافة التكاليف وللمشروع الحق في اتخاذ اي اجراء مناسب لذلك .
          </span>{' '}
          وأقر بالموافقة علي النظام العلاجي الذي يسير عليه المشروع وأي تعديلات تتم اثناء العام الصادرة من لجنة العلاج العليا للمشروع وأتبرع تكافلا بمبلغ اشتراكي لعلاج زملائى المشتركين وأتعاون معهم في سداد قيمة العلاج.
        </span>
      </div>

      <div className="mt-8 flex justify-end">
        <div className="text-center w-48 ml-8">
          <p className="font-bold mb-8">المقر بما فيه</p>
          <div className="border-b-[2px] border-dotted border-gray-600 w-full"></div>
        </div>
      </div>
    </section>
  );
}
