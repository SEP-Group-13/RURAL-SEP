import { SearchIcon } from "lucide-react";

export default function Search(){
    return <>
        <div className="bg-sidebar-surface px-2 py-1.5 text-m relative flex w-full items-center rounded">
            <SearchIcon className="size-[1em] mr-2"/>
            <input type="text" placeholder="Search" className="w-full placeholder:text-stone-400 focus:outline-none"/>
        </div>
    </>
}